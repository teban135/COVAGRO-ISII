@echo off
echo Deteniendo Covagro SII...

echo.
echo [1/2] Buscando y deteniendo el servidor Backend (Puerto 8000)...
FOR /F "tokens=5" %%T IN ('netstat -a -n -o ^| findstr :8000') DO (
    echo Matando proceso PID: %%T
    taskkill /F /PID %%T
)

echo.
echo [2/2] Buscando y deteniendo el servidor Frontend (Puerto 5173)...
FOR /F "tokens=5" %%T IN ('netstat -a -n -o ^| findstr :5173') DO (
    echo Matando proceso PID: %%T
    taskkill /F /PID %%T
)

echo.
echo Proyecto detenido correctamente.
pause
