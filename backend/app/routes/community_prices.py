# app/routes/community_prices.py

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from datetime import datetime, timedelta
import boto3
from botocore.exceptions import NoCredentialsError
import os
import uuid
import re
from PIL import Image
import io
import random
import math

from ..database import get_db
from ..models import CommunityPrice, PriceVote, Product, User, Store
from ..schemas import (
    CommunityPriceCreate, CommunityPrice as CommunityPriceSchema,
    CommunityPriceResponse, CommunityPriceWithVotes, CommunityPriceWithChange, 
    TrendingPriceWithProduct, PriceVoteCreate, PricePhotoUploadResponse, BarcodeSearchResponse,
    Store as StoreSchema, StoreWithDistance
)
from ..auth import get_current_user

router = APIRouter()

# Initialize S3 client
s3_client = boto3.client(
    's3',
    aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
    aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY'),
    region_name=os.getenv('AWS_REGION', 'eu-west-1')
)
BUCKET_NAME = os.getenv('AWS_S3_BUCKET', 'mastermarket-images')

@router.post("/submit", response_model=CommunityPriceResponse)
async def submit_price(
    price_data: CommunityPriceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Submit a new community price for a product"""
    # Check if product exists
    product = db.query(Product).filter(Product.id == price_data.product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Create new community price
    new_price = CommunityPrice(
        product_id=price_data.product_id,
        user_id=current_user.id,
        store_name=price_data.store_name,
        store_location=price_data.store_location,
        price=price_data.price,
        price_photo_url=price_data.price_photo_url,
        currency=price_data.currency
    )
    
    db.add(new_price)
    db.commit()
    db.refresh(new_price)
    
    return new_price

@router.post("/extract-price", response_model=PricePhotoUploadResponse)
async def extract_price_from_photo(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Extract price from photo without storing it"""
    # Validate file type
    if not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="Only image files are allowed")
    
    try:
        # Read file content
        file_content = await file.read()
        
        # Process image for OCR without saving to S3
        try:
            # Convert bytes to image
            image = Image.open(io.BytesIO(file_content))
            
            # For now, we'll return a mock extracted price
            # In production, you would use:
            # - pytesseract for local OCR
            # - AWS Textract (can process without storing)
            # - Google Vision API
            # - Azure Computer Vision API
            
            # Mock price extraction (random price between 0.50 and 50.00)
            mock_price = round(random.uniform(0.50, 50.00), 2)
            
            return {
                "success": True,
                "photo_url": None,  # No photo URL since we're not storing it
                "extracted_price": mock_price,
                "message": f"Price detected: £{mock_price}"
            }
        except Exception as e:
            # If OCR fails, return error
            return {
                "success": True,
                "photo_url": None,
                "extracted_price": None,
                "message": "Could not extract price. Please enter manually."
            }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/search-barcode/{barcode}", response_model=BarcodeSearchResponse)
async def search_by_barcode(
    barcode: str,
    db: Session = Depends(get_db)
):
    """Search for a product by barcode"""
    product = db.query(Product).filter(Product.barcode == barcode).first()
    
    if product:
        return {
            "found": True,
            "product": product,
            "message": None
        }
    else:
        return {
            "found": False,
            "product": None,
            "message": "Product not found. You can add it as a new product."
        }

@router.get("/product/{product_id}/prices", response_model=List[CommunityPriceWithVotes])
async def get_product_prices(
    product_id: int,
    location: Optional[str] = Query(None, description="Filter by location"),
    days: Optional[int] = Query(7, description="Number of days to look back"),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user)
):
    """Get all community prices for a product with user's vote status"""
    # Build query
    query = db.query(CommunityPrice).filter(
        CommunityPrice.product_id == product_id,
        CommunityPrice.created_at >= datetime.utcnow() - timedelta(days=days)
    )
    
    # Apply location filter if provided
    if location:
        query = query.filter(CommunityPrice.store_location.ilike(f"%{location}%"))
    
    # Order by votes and recency
    prices = query.order_by(
        (CommunityPrice.upvotes - CommunityPrice.downvotes).desc(),
        CommunityPrice.created_at.desc()
    ).all()
    
    # Add user vote information if user is authenticated
    result = []
    for price in prices:
        price_dict = {
            "id": price.id,
            "product_id": price.product_id,
            "user_id": price.user_id,
            "store_name": price.store_name,
            "store_location": price.store_location,
            "price": price.price,
            "price_photo_url": price.price_photo_url,
            "currency": price.currency,
            "upvotes": price.upvotes,
            "downvotes": price.downvotes,
            "verification_status": price.verification_status,
            "created_at": price.created_at,
            "updated_at": price.updated_at,
            "user_vote": None
        }
        
        if current_user:
            user_vote = db.query(PriceVote).filter(
                PriceVote.price_id == price.id,
                PriceVote.user_id == current_user.id
            ).first()
            if user_vote:
                price_dict["user_vote"] = user_vote.vote_type
        
        result.append(price_dict)
    
    return result

@router.post("/vote", response_model=dict)
async def vote_on_price(
    vote_data: PriceVoteCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Vote on a community price (upvote or downvote)"""
    # Validate vote type
    if vote_data.vote_type not in ['upvote', 'downvote']:
        raise HTTPException(status_code=400, detail="Vote type must be 'upvote' or 'downvote'")
    
    # Check if price exists
    price = db.query(CommunityPrice).filter(CommunityPrice.id == vote_data.price_id).first()
    if not price:
        raise HTTPException(status_code=404, detail="Price not found")
    
    # Check if user already voted
    existing_vote = db.query(PriceVote).filter(
        PriceVote.price_id == vote_data.price_id,
        PriceVote.user_id == current_user.id
    ).first()
    
    if existing_vote:
        # Update existing vote
        old_vote_type = existing_vote.vote_type
        existing_vote.vote_type = vote_data.vote_type
        
        # Update vote counts
        if old_vote_type != vote_data.vote_type:
            if old_vote_type == 'upvote':
                price.upvotes -= 1
                price.downvotes += 1
            else:
                price.downvotes -= 1
                price.upvotes += 1
    else:
        # Create new vote
        new_vote = PriceVote(
            price_id=vote_data.price_id,
            user_id=current_user.id,
            vote_type=vote_data.vote_type
        )
        db.add(new_vote)
        
        # Update vote counts
        if vote_data.vote_type == 'upvote':
            price.upvotes += 1
        else:
            price.downvotes += 1
    
    # Update verification status based on votes
    total_votes = price.upvotes + price.downvotes
    if total_votes >= 10:  # Minimum votes for verification
        if price.upvotes / total_votes >= 0.8:  # 80% approval
            price.verification_status = 'verified'
        elif price.downvotes / total_votes >= 0.6:  # 60% disapproval
            price.verification_status = 'disputed'
    
    db.commit()
    
    return {
        "success": True,
        "upvotes": price.upvotes,
        "downvotes": price.downvotes,
        "verification_status": price.verification_status
    }

@router.delete("/vote/{price_id}", response_model=dict)
async def remove_vote(
    price_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Remove user's vote from a price"""
    # Find the vote
    vote = db.query(PriceVote).filter(
        PriceVote.price_id == price_id,
        PriceVote.user_id == current_user.id
    ).first()
    
    if not vote:
        raise HTTPException(status_code=404, detail="Vote not found")
    
    # Update price vote counts
    price = db.query(CommunityPrice).filter(CommunityPrice.id == price_id).first()
    if vote.vote_type == 'upvote':
        price.upvotes -= 1
    else:
        price.downvotes -= 1
    
    # Delete the vote
    db.delete(vote)
    db.commit()
    
    return {
        "success": True,
        "upvotes": price.upvotes,
        "downvotes": price.downvotes
    }

@router.get("/trending", response_model=List[TrendingPriceWithProduct])
async def get_trending_prices(
    location: Optional[str] = Query(None, description="Filter by location"),
    limit: int = Query(10, description="Number of results to return"),
    db: Session = Depends(get_db)
):
    """Get trending price updates with product information"""
    query = db.query(CommunityPrice, Product).join(
        Product, CommunityPrice.product_id == Product.id
    ).filter(
        CommunityPrice.created_at >= datetime.utcnow() - timedelta(days=7)  # Extended to 7 days for more results
    )
    
    if location:
        query = query.filter(CommunityPrice.store_location.ilike(f"%{location}%"))
    
    # Order by engagement (total votes) and recency
    results = query.order_by(
        (CommunityPrice.upvotes + CommunityPrice.downvotes).desc(),
        CommunityPrice.created_at.desc()
    ).limit(limit).all()
    
    # Format response with product information
    trending_with_product = []
    for community_price, product in results:
        trending_with_product.append({
            "id": community_price.id,
            "product_id": community_price.product_id,
            "user_id": community_price.user_id,
            "store_name": community_price.store_name,
            "store_location": community_price.store_location,
            "price": community_price.price,
            "price_photo_url": community_price.price_photo_url,
            "currency": community_price.currency,
            "upvotes": community_price.upvotes,
            "downvotes": community_price.downvotes,
            "verification_status": community_price.verification_status,
            "created_at": community_price.created_at,
            "updated_at": community_price.updated_at,
            "product_name": product.name,
            "product_image_url": product.image_url
        })
    
    return trending_with_product

@router.get("/product/{product_id}/recent-prices", response_model=List[CommunityPriceWithChange])
async def get_product_recent_prices(
    product_id: int,
    limit: int = Query(3, description="Number of recent prices to return"),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(lambda: None)  # Make auth optional
):
    """Get recent prices for a product with price change calculation"""
    
    # Get recent prices for the product
    recent_prices = db.query(CommunityPrice).filter(
        CommunityPrice.product_id == product_id
    ).order_by(CommunityPrice.created_at.desc()).limit(limit * 3).all()  # Get more to calculate changes per store
    
    # Group by store and calculate price changes
    store_prices = {}
    for price in recent_prices:
        store_key = price.store_name.lower()
        if store_key not in store_prices:
            store_prices[store_key] = []
        store_prices[store_key].append(price)
    
    # Get the most recent price per store with change calculation
    result_prices = []
    for store_name, store_price_list in store_prices.items():
        if len(result_prices) >= limit:
            break
            
        # Sort by date (most recent first)
        store_price_list.sort(key=lambda x: x.created_at, reverse=True)
        
        latest_price = store_price_list[0]
        previous_price = store_price_list[1] if len(store_price_list) > 1 else None
        
        # Calculate percentage change
        price_change_percentage = None
        if previous_price:
            if previous_price.price > 0:
                price_change_percentage = ((latest_price.price - previous_price.price) / previous_price.price) * 100
        
        # Get user vote if authenticated
        user_vote = None
        if current_user:
            vote = db.query(PriceVote).filter(
                PriceVote.price_id == latest_price.id,
                PriceVote.user_id == current_user.id
            ).first()
            if vote:
                user_vote = vote.vote_type
        
        # Create response object
        price_data = {
            "id": latest_price.id,
            "product_id": latest_price.product_id,
            "user_id": latest_price.user_id,
            "store_name": latest_price.store_name,
            "store_location": latest_price.store_location,
            "price": latest_price.price,
            "price_photo_url": latest_price.price_photo_url,
            "currency": latest_price.currency,
            "upvotes": latest_price.upvotes,
            "downvotes": latest_price.downvotes,
            "verification_status": latest_price.verification_status,
            "created_at": latest_price.created_at,
            "updated_at": latest_price.updated_at,
            "user_vote": user_vote,
            "price_change_percentage": price_change_percentage,
            "previous_price": previous_price.price if previous_price else None
        }
        
        result_prices.append(price_data)
    
    return result_prices

@router.get("/nearby-stores")
async def get_nearby_stores(
    latitude: float = Query(..., description="User's current latitude"),
    longitude: float = Query(..., description="User's current longitude"), 
    radius_meters: int = Query(5000, description="Search radius in meters (default 5km)"),
    keyword: str = Query("supermarket grocery", description="Search keywords")
):
    """Get stores near a location using Google Places API"""
    
    # Get Google API key from environment
    google_api_key = os.getenv("GOOGLE_PLACES_API_KEY")
    
    if not google_api_key:
        # Fallback to mock data if no API key
        return [
            {
                "name": "Tesco Express",
                "address": "123 High Street, London",
                "distance_meters": 250,
                "place_id": "mock_1"
            },
            {
                "name": "Sainsbury's Local", 
                "address": "45 Main Road, London",
                "distance_meters": 480,
                "place_id": "mock_2"
            },
            {
                "name": "ASDA",
                "address": "78 Park Lane, London", 
                "distance_meters": 720,
                "place_id": "mock_3"
            }
        ]
    
    try:
        # Google Places API (New) - Nearby Search
        import requests
        
        url = "https://places.googleapis.com/v1/places:searchNearby"
        headers = {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": google_api_key,
            "X-Goog-FieldMask": "places.displayName,places.formattedAddress,places.location,places.rating,places.userRatingCount,places.currentOpeningHours,places.types,places.id"
        }
        
        # Request body for new API
        payload = {
            "includedTypes": ["supermarket", "grocery_store", "convenience_store"],
            "maxResultCount": 20,
            "locationRestriction": {
                "circle": {
                    "center": {
                        "latitude": latitude,
                        "longitude": longitude
                    },
                    "radius": radius_meters
                }
            }
        }
        
        response = requests.post(url, headers=headers, json=payload)
        data = response.json()
        
        if response.status_code != 200:
            raise HTTPException(status_code=400, detail=f"Google Places API error: {data}")
        
        # Format results for new API structure
        stores = []
        for place in data.get("places", []):
            store = {
                "name": place.get("displayName", {}).get("text", "Unknown Store"),
                "address": place.get("formattedAddress", "Address not available"),
                "place_id": place.get("id"),
                "distance_meters": None,
                "types": place.get("types", []),
                "rating": place.get("rating"),
                "user_ratings_total": place.get("userRatingCount"),
                "opening_hours": place.get("currentOpeningHours", {}).get("openNow") if place.get("currentOpeningHours") else None
            }
            
            # Calculate distance if location is available
            if place.get("location"):
                place_lat = place["location"]["latitude"]
                place_lng = place["location"]["longitude"]
                
                # Simple distance calculation
                R = 6371000  # Earth's radius in meters
                lat1_rad = math.radians(latitude)
                lat2_rad = math.radians(place_lat)
                delta_lat = math.radians(place_lat - latitude)
                delta_lon = math.radians(place_lng - longitude)
                
                a = math.sin(delta_lat/2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(delta_lon/2)**2
                c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
                distance = R * c
                
                store["distance_meters"] = round(distance)
            
            stores.append(store)
        
        # Sort by distance
        stores.sort(key=lambda x: x["distance_meters"] if x["distance_meters"] else float('inf'))
        
        return stores
        
    except requests.RequestException as e:
        raise HTTPException(status_code=500, detail=f"Error calling Google Places API: {str(e)}")

@router.get("/popular-stores", response_model=List[dict])
async def get_popular_stores(
    limit: int = Query(10, description="Number of stores to return"),
    db: Session = Depends(get_db)
):
    """Get stores by popularity (most price submissions)"""
    
    # Query to get store names with price submission counts
    popular_stores = db.query(
        CommunityPrice.store_name,
        CommunityPrice.store_location,
        func.count(CommunityPrice.id).label('submission_count')
    ).group_by(
        CommunityPrice.store_name,
        CommunityPrice.store_location
    ).order_by(
        func.count(CommunityPrice.id).desc()
    ).limit(limit).all()
    
    return [
        {
            "store_name": store.store_name,
            "store_location": store.store_location,
            "submission_count": store.submission_count
        }
        for store in popular_stores
    ]