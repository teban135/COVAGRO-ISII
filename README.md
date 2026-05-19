# Covagro SII

Bienvenido a **Covagro SII**, un sistema integral de información diseñado para la gestión de inventarios, productos, pedidos, notificaciones y reportes. Este proyecto está dividido en dos partes principales: un **Backend** desarrollado en Django (Python) y un **Frontend** desarrollado en React + Vite.

## Requisitos Previos
- Python 3.x
- Node.js y npm
- Git

## 📥 Descarga del Proyecto

Para descargar el proyecto a tu máquina local, clona el repositorio utilizando Git:

```bash
git clone <URL_DEL_REPOSITORIO>
cd Covagro-SII
```

## ⚙️ Configuración y Ejecución del Backend (Django)

1. **Navega a la carpeta del Backend:**
   ```bash
   cd Backend
   ```

2. **Crea un entorno virtual:**
   ```bash
   python -m venv venv
   ```

3. **Activa el entorno virtual:**
   - En **Windows**:
     ```powershell
     venv\Scripts\activate
     ```
   - En **macOS / Linux**:
     ```bash
     source venv/bin/activate
     ```

4. **Instala las dependencias:**
   Una vez activado el entorno, instala los paquetes requeridos:
   ```bash
   pip install -r requirements.txt
   ```

5. **Aplica las migraciones de la base de datos (si es necesario):**
   ```bash
   python manage.py migrate
   ```

6. **Ejecuta el servidor del Backend:**
   ```bash
   python manage.py runserver
   ```
   El backend estará disponible en `http://127.0.0.1:8000/`.

## 🎨 Configuración y Ejecución del Frontend (React + Vite)

Abre una **nueva terminal**, mantén el servidor del Backend corriendo en la terminal anterior, y sigue estos pasos:

1. **Navega a la carpeta del Frontend:**
   ```bash
   cd Fronted
   ```

2. **Instala las dependencias de Node.js:**
   ```bash
   npm install
   ```

3. **Ejecuta el servidor de desarrollo del Frontend:**
   ```bash
   npm run dev
   ```
   El frontend estará disponible en `http://localhost:5173/` (o el puerto que Vite asigne).

## 🚀 Automatización

En la raíz del proyecto encontrarás dos scripts de Windows (`.bat`) para facilitar el inicio y detención del proyecto completo:

- `iniciar_proyecto.bat`: Inicia automáticamente el backend y el frontend en ventanas separadas.
- `detener_proyecto.bat`: Detiene los procesos de Python y Node.js relacionados con el proyecto.
