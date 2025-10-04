@echo off
echo Aplicando cambios para el punto central del caleidoscopio...

echo 1. Añadiendo variables globales al archivo sketch.js...
echo // Variables globales para el punto central del caleidoscopio >> temp.js
echo let kaleidoCenterX = null; >> temp.js
echo let kaleidoCenterY = null; >> temp.js
echo. >> temp.js
type sketch.js >> temp.js
move /y temp.js sketch.js

echo 2. Modificando la función mousePressed en sketch.js...
powershell -Command "(Get-Content sketch.js) -replace 'function mousePressed\(\) \{\r?\n\s*isMousePressed = true;', 'function mousePressed() {\r\n    isMousePressed = true;\r\n    \r\n    // Establecer el punto central del caleidoscopio en la posición inicial del clic\r\n    // Solo si no estamos sobre la GUI o el botón de cerrar\r\n    if (!isOverGui && !isOverOpenButton) {\r\n        kaleidoCenterX = mouseX;\r\n        kaleidoCenterY = mouseY;\r\n        console.log(''Punto central del caleidoscopio establecido en:'', kaleidoCenterX, kaleidoCenterY);\r\n    }' | Set-Content sketch.js.tmp"
move /y sketch.js.tmp sketch.js

echo 3. Modificando la función drawStandardBrush en standardbrush.js...
powershell -Command "(Get-Content standardbrush.js) -replace 'const centerX = windowWidth / 2;\r?\n\s*const centerY = windowHeight / 2;', 'const centerX = kaleidoCenterX !== null ? kaleidoCenterX : windowWidth / 2;\r\n        const centerY = kaleidoCenterY !== null ? kaleidoCenterY : windowHeight / 2;' | Set-Content standardbrush.js.tmp"
move /y standardbrush.js.tmp standardbrush.js

echo 4. Modificando la función drawLineBrush en linebrush.js...
powershell -Command "(Get-Content linebrush.js) -replace 'const centerX = windowWidth / 2;\r?\n\s*const centerY = windowHeight / 2;', 'const centerX = kaleidoCenterX !== null ? kaleidoCenterX : windowWidth / 2;\r\n        const centerY = kaleidoCenterY !== null ? kaleidoCenterY : windowHeight / 2;' | Set-Content linebrush.js.tmp"
move /y linebrush.js.tmp linebrush.js

echo 5. Modificando la función drawTextBrush en textbrush.js...
powershell -Command "(Get-Content textbrush.js) -replace 'const centerX = windowWidth / 2;\r?\n\s*const centerY = windowHeight / 2;', 'const centerX = kaleidoCenterX !== null ? kaleidoCenterX : windowWidth / 2;\r\n        const centerY = kaleidoCenterY !== null ? kaleidoCenterY : windowHeight / 2;' | Set-Content textbrush.js.tmp"
move /y textbrush.js.tmp textbrush.js

echo 6. Modificando la función drawGeometryBrush en geometrybrush.js...
powershell -Command "(Get-Content geometrybrush.js) -replace 'const centerX = windowWidth / 2;\r?\n\s*const centerY = windowHeight / 2;', 'const centerX = kaleidoCenterX !== null ? kaleidoCenterX : windowWidth / 2;\r\n        const centerY = kaleidoCenterY !== null ? kaleidoCenterY : windowHeight / 2;' | Set-Content geometrybrush.js.tmp"
move /y geometrybrush.js.tmp geometrybrush.js

echo 7. Modificando la función drawPixelBrush en pixelbrush.js...
powershell -Command "(Get-Content pixelbrush.js) -replace 'const centerX = windowWidth / 2;\r?\n\s*const centerY = windowHeight / 2;', 'const centerX = kaleidoCenterX !== null ? kaleidoCenterX : windowWidth / 2;\r\n        const centerY = kaleidoCenterY !== null ? kaleidoCenterY : windowHeight / 2;' | Set-Content pixelbrush.js.tmp"
move /y pixelbrush.js.tmp pixelbrush.js

echo 8. Modificando la función drawArtBrush en artbrush.js...
powershell -Command "(Get-Content artbrush.js) -replace 'const centerX = windowWidth / 2;\r?\n\s*const centerY = windowHeight / 2;', 'const centerX = kaleidoCenterX !== null ? kaleidoCenterX : windowWidth / 2;\r\n        const centerY = kaleidoCenterY !== null ? kaleidoCenterY : windowHeight / 2;' | Set-Content artbrush.js.tmp"
move /y artbrush.js.tmp artbrush.js

echo 9. Añadiendo reseteo del punto central al final de mouseReleased en sketch.js...
powershell -Command "(Get-Content sketch.js) -replace 'isMousePressed = false;', 'isMousePressed = false;\r\n    \r\n    // Resetear el punto central del caleidoscopio después de dibujar\r\n    kaleidoCenterX = null;\r\n    kaleidoCenterY = null;' | Set-Content sketch.js.tmp"
move /y sketch.js.tmp sketch.js

echo Cambios aplicados correctamente!
pause
