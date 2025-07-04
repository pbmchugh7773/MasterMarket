#!/bin/bash

echo "🔍 Validating dependencies..."

# Check if package-lock.json exists
if [ ! -f "package-lock.json" ]; then
    echo "⚠️  Warning: package-lock.json not found"
fi

# Check for peer dependency warnings
echo "📦 Checking npm dependencies..."
npm ls --depth=0 2>&1 | grep -E "(WARN|ERR)" && echo "⚠️  Dependency warnings found" || echo "✅ No dependency warnings"

# Check for duplicate dependencies
echo "🔄 Checking for duplicate dependencies..."
npm dedupe --dry-run 2>&1 | grep -E "removed|moved" && echo "⚠️  Duplicate dependencies found" || echo "✅ No duplicate dependencies"

# Check TypeScript compilation
echo "📝 Checking TypeScript compilation..."
npx tsc --noEmit 2>&1 | head -20 && echo "⚠️  TypeScript errors found" || echo "✅ TypeScript compilation OK"

# Check if all dependencies are installed
echo "📋 Verifying all dependencies are installed..."
npm list --depth=0 2>&1 | grep -E "UNMET|missing" && echo "❌ Missing dependencies found" || echo "✅ All dependencies installed"

echo "✨ Validation complete!"