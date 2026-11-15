# Guía de Contribución · Racing Team Manager

¡Gracias por tu interés en contribuir al desarrollo de **Racing Team Manager**!

## Desarrollo en Local

El proyecto es 100 % estático (HTML, CSS y JavaScript vanilla) y no requiere compilación previa. Para evitar restricciones de CORS/Canvas al leer píxeles de imágenes locales (`getImageData`), sirve el repositorio mediante un servidor HTTP local:

```bash
# Con Python 3
python3 -m http.server 8080

# O con Node.js
npx serve .
```

Luego abre `http://localhost:8080` en tu navegador.

## Estructura del Código

- `index.html`: Marcado HTML principal y carga ordenada de estilos y scripts.
- `css/`: Hojas de estilo separadas por pantalla/módulo (`splash`, `loader`, `race-hud`, `pitwall-weekend`, `frontend-tp`, `season`).
- `js/data/`: Datos estáticos de gran volumen (diccionario de traducción ES→EN, geometría de circuitos, banco de entrevistas, catálogo del modo temporada).
- `js/core/`: Splash inicial, motor de traducción en vivo (`i18n.js`) y precarga de recursos (`loader.js`).
- `js/race/`: Motor de física/estrategia, renderizado Canvas 2D y Pit Wall.
- `js/weekend/`: Sesiones de entrenamientos libres, clasificación, garaje y reglajes.
- `js/frontend/`: Menú principal, selector de escudería, presentación de sede (HQ), creador de Team Principal y entrevistas.
- `js/season/`: Estado, interfaz de departamentos HQ, túnel de viento y mesa de diseño del Modo Temporada.

## Reglas para Modificar Assets (`assets/`)

Varias imágenes se utilizan como **mapas de datos por píxel** mediante `<canvas>` (`getImageData`). Ten especial cuidado si las editas:

1. **`assets/img/circuito.png`** (`2752×1536`, PNG sin pérdida): El motor analiza los colores del asfalto, pianos, hierba y grava al cargar (`readGround`). Debe guardarse siempre como **PNG sin pérdida**.
2. **`assets/img/box_m.png`** (PNG sin pérdida): Máscara RGB del garaje:
   - Canal **R**: `1` = color primario del equipo, `2` = color secundario.
   - Canal **G**: factor de sombreado (`× 100`).
   - Canal **B**: intensidad de azul original a sustituir.
3. **`assets/tp/*_l.png`** y **`assets/tp/head_base*.png`** (PNG sin pérdida): Mapas de etiquetas para recolorear piel, pelo, pantalones y chaqueta del Team Principal (`R` = zona, `G` = sombreado).

## Traducciones

El juego se escribe originalmente en español y se traduce al vuelo al inglés mediante `js/data/i18n-dict.js` (`window.RTM_DICT` y `window.RTM_WORDS`). Si añades textos nuevos en español en la UI o en Canvas, recuerda añadir su clave en minúsculas en `window.RTM_DICT`.

## Antes de Abrir un Pull Request

1. Verifica que no haya errores de sintaxis en ningún fichero JS:
   ```bash
   for f in $(find js -name '*.js'); do node --check "$f" || exit 1; done
   ```
2. Prueba el flujo completo en tu servidor local (Splash → Menú → Selección de Equipo → HQ / Fin de semana / Carrera) sin errores en la consola del navegador.
