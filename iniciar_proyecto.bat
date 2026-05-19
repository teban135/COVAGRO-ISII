@echo off
echo Iniciando Covagro SII...

echo [1/2] Iniciando Backend (Django)...
start "Backend - Covagro SII" cmd /c "cd Backend && if not exist venv (echo Creando entorno virtual... && python -m venv venv) && call venv\Scripts\activate && echo Instalando dependencias... && pip install -r requirements.txt && echo Iniciando servidor... && python manage.py runserver"

echo [2/2] Iniciando Frontend (React + Vite)...
start "Frontend - Covagro SII" cmd /c "cd Fronted && echo Instalando dependencias de Node... && npm install && echo Iniciando servidor de desarrollo... && npm run dev"

echo.
echo Los servidores se estan iniciando en ventanas separadas.
echo Cierra esta ventana si lo deseas.
pause
