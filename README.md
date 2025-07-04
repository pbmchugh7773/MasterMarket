# MasterMarket

MasterMarket es una aplicación móvil completa de seguimiento de precios y e-commerce que permite a los usuarios comparar precios, gestionar su carrito de compras y contribuir con precios comunitarios.

## 🚀 Características Principales

- **Seguimiento de Precios Comunitarios**: Los usuarios pueden enviar y votar por precios de productos
- **Carrito de Compras**: Gestión completa del carrito con cantidades y cálculos
- **Autenticación Dual**: Login tradicional con email/contraseña y Google OAuth
- **Selección de País/Moneda**: Soporte para 9 países con símbolos de moneda locales
- **Escaneo de Códigos de Barras**: Búsqueda de productos por código de barras
- **Panel de Administración**: Gestión de productos y precios para administradores
- **Historial de Precios**: Seguimiento de cambios de precios a lo largo del tiempo
- **Precios Trending**: Visualización de productos con precios más populares

## 🏗️ Arquitectura del Sistema

### Backend (FastAPI + PostgreSQL)
- **API RESTful** con FastAPI
- **Base de Datos** PostgreSQL con SQLAlchemy ORM
- **Autenticación JWT** con soporte para Google OAuth
- **Almacenamiento de Imágenes** en AWS S3
- **Contenedores Docker** para desarrollo y producción

### Frontend (React Native + Expo)
- **Navegación** con Expo Router
- **Gestión de Estado** con Context API
- **UI Components** con Expo Vector Icons
- **Cámara y Localización** para funcionalidades avanzadas

## 🛠️ Instalación y Configuración

### Prerrequisitos
- Docker y Docker Compose
- Node.js 18+ 
- PostgreSQL 12+
- Expo CLI

### Configuración del Backend

1. **Clonar el repositorio**
```bash
git clone https://github.com/pbmchugh7773/MasterMarket.git
cd MasterMarket_Project
```

2. **Configurar variables de entorno**
```bash
cd backend
cp .env.example .env
# Editar .env con tus configuraciones
```

3. **Iniciar con Docker**
```bash
docker-compose up --build
```

4. **Ejecutar migraciones**
```bash
python backend/migrate_db.py
python backend/init_stores.py
```

### Configuración del Frontend

1. **Instalar dependencias**
```bash
cd mobile
npm install
```

2. **Iniciar el servidor de desarrollo**
```bash
npm start
# o
npx expo start --clear
```

3. **Ejecutar en dispositivo/emulador**
```bash
npm run android  # Para Android
npm run ios      # Para iOS
npm run web      # Para web
```

## 🔧 Configuración de Google OAuth

### Paso 1: Google Cloud Console
1. Ir a [Google Cloud Console](https://console.cloud.google.com/)
2. Crear un nuevo proyecto o seleccionar existente
3. Habilitar APIs: Google+ API y OAuth2 API

### Paso 2: Configurar OAuth Consent Screen
- Tipo: Externo
- Nombre de la app: MasterMarket
- Emails de soporte y desarrollador

### Paso 3: Crear OAuth 2.0 Client IDs

**Para Android:**
- Tipo: Android
- Nombre: MasterMarket Android
- Package name: `com.mastermarket.mobile`
- SHA-1: `ED:E0:8C:C0:EF:75:8F:DD:7F:9C:97:09:DF:C8:A5:C2:4A:2C:7E:62`

**Para Backend:**
- Tipo: Web application
- Nombre: MasterMarket Backend
- URIs autorizadas: `http://localhost:8000`, `http://192.168.1.25:8000`

## 📊 Base de Datos

### Tablas Principales

- **users**: Usuarios del sistema con autenticación
- **products**: Catálogo de productos con categorías
- **community_prices**: Precios enviados por la comunidad
- **price_history**: Historial de cambios de precios
- **shopping_carts**: Carritos de compras de usuarios
- **cart_items**: Items individuales en carritos
- **stores**: Información de tiendas
- **countries**: Países soportados con monedas
- **user_votes**: Votos de usuarios en precios comunitarios

## 🌍 Países y Monedas Soportadas

| País | Moneda | Símbolo |
|------|---------|---------|
| Argentina | ARS | $ |
| Chile | CLP | $ |
| Colombia | COP | $ |
| México | MXN | $ |
| Perú | PEN | S/ |
| Ecuador | USD | $ |
| Uruguay | UYU | $ |
| España | EUR | € |
| Estados Unidos | USD | $ |

## 🚀 Deployment

### Desarrollo Local
```bash
# Backend
docker-compose up --build

# Frontend
cd mobile && npm start
```

### Producción (AWS EC2)
- **CI/CD**: GitHub Actions
- **Análisis de Código**: SonarQube
- **Contenedores**: Docker en EC2
- **Base de Datos**: PostgreSQL en AWS RDS

## 📱 Funcionalidades Móviles

### Pantallas Principales
- **Home**: Lista de productos con precios comunitarios
- **Carrito**: Gestión del carrito de compras
- **Perfil**: Información del usuario y configuraciones
- **Admin**: Panel de administración (solo admins)

### Funcionalidades Especiales
- **Escáner de Código de Barras**: Búsqueda rápida de productos
- **Indicador de País/Moneda**: Bandera y símbolo en la interfaz
- **Precios Trending**: Productos más populares
- **Votación de Precios**: Sistema de upvote/downvote

## 🔐 Autenticación y Seguridad

- **JWT Tokens**: Autenticación basada en tokens
- **Google OAuth**: Login social con Google
- **Roles de Usuario**: admin, user
- **Validación de Datos**: Pydantic schemas
- **Encriptación**: bcrypt para contraseñas

## 🧪 Testing

```bash
# Backend
cd backend
python -m pytest

# Frontend
cd mobile
npm test
```

## 📚 API Documentation

Una vez que el backend esté ejecutándose, la documentación interactiva está disponible en:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## 🛠️ Comandos Útiles

```bash
# Backend
docker-compose logs -f backend      # Ver logs del backend
docker-compose exec backend bash    # Acceder al contenedor

# Frontend
npx expo install --fix             # Reparar dependencias
npx expo doctor                    # Diagnóstico del proyecto
```

## 🤝 Contribución

1. Fork el repositorio
2. Crear una rama feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit los cambios (`git commit -m 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Crear un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.

## 🔗 Enlaces Útiles

- [Repositorio GitHub](https://github.com/pbmchugh7773/MasterMarket)
- [Documentación de FastAPI](https://fastapi.tiangolo.com/)
- [Documentación de Expo](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/)

## 📞 Soporte

Para reportar bugs o solicitar nuevas funcionalidades, por favor crear un issue en el repositorio de GitHub.

---

**Desarrollado con ❤️ por el equipo de MasterMarket**