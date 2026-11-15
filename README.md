# Racing Team Manager

Juego de gestión de escudería de competición desarrollado por **Épsilon Games Studio**.

## Inicio Rápido (Desarrollo Local)

Al utilizar análisis de píxeles sobre `<canvas>` (`getImageData`), es necesario servir los archivos mediante un servidor HTTP local (no abrir `index.html` directamente con `file://`):

```bash
python3 -m http.server 8080
```

Visita `http://localhost:8080` en tu navegador.

## Estructura del Proyecto

```text
├── index.html                      # Documento principal limpio (~270 líneas)
├── CONTRIBUTING.md                 # Guía para colaboradores y especificaciones de assets
├── assets/
│   ├── img/                        # Sprites principales (circuito, coches, logos, garaje, parrilla)
│   ├── splash/                     # Imágenes de la animación inicial de Épsilon Games Studio
│   ├── hq/                         # Fotografías de sedes y departamentos
│   ├── iv/                         # Escenarios de entrevistas (estudio de TV y pit lane)
│   ├── parts/                      # Piezas del monoplaza y flujo aerodinámico
│   ├── pt/                         # Hojas de sprites para retratos dinámicos de pilotos
│   └── tp/                         # Capas y máscaras del creador de Team Principal
├── css/
│   ├── splash.css                  # Pantalla inicial de estudio
│   ├── loader.css                  # Pantalla de carga del circuito
│   ├── race-hud.css                # HUD de carrera, cronometraje y clasificación
│   ├── pitwall-weekend.css         # Pit Wall, menús de carrera, garaje y reglajes
│   ├── frontend-tp.css             # Menú principal, selección de equipo, HQ y entrevistas
│   └── season.css                  # Modo Temporada, gráficas SVG, túnel de viento y diseño
└── js/
    ├── data/                       # Datos estáticos (i18n, geometría del circuito, entrevistas, temporada)
    ├── core/                       # Splash, motor de traducción ES/EN y cargador de recursos
    ├── race/                       # Motor de simulación de carrera, renderizado Canvas 2D y Pit Wall
    ├── weekend/                    # Sesiones FP1-FP3, Q1-Q3, reglajes y radio de equipo
    ├── frontend/                   # Menús, presentación HQ, creador de Team Principal y prensa
    └── season/                     # Estado de temporada, pantallas de departamentos y túnel de viento
```

## Contribuir

Consulta [CONTRIBUTING.md](CONTRIBUTING.md) para conocer los detalles sobre convenciones, formato de máscaras RGB en `assets/` y pasos de verificación antes de enviar un Pull Request.
