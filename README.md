# PokéCardDex v3

PWA Angular 22 para completar una Pokédex mediante cartas Pokémon TCG y administrar una colección física local.

## Novedades de la tercera actualización

- Estado persistente del Dex: búsqueda, filtros, orden y posición de desplazamiento sobreviven al detalle, al botón Atrás y a recargas de sesión.
- Filtros sincronizados en query parameters.
- Navegación móvil tipo Cupertino con tab bar, safe areas de iPhone, bottom sheets y controles táctiles.
- Diseño visual de Pokédex renovado.
- Gestión de variantes por carta: idioma, cantidad, condición, acabado, primera edición, graduación, precio pagado, valor estimado, moneda, fecha, ubicación y notas.
- Contadores separados de Pokémon, cartas únicas y copias totales.
- Valor estimado y costo registrado (los precios externos son referencias y pueden variar por idioma/condición).
- Más de 25 medallas y notificaciones personalizadas con el nombre del entrenador.
- Migración IndexedDB v3 que conserva los datos de versiones anteriores.
- Respaldo JSON schema v3 compatible con respaldos v1/v2.
- Aviso de nueva versión PWA con actualización controlada.

## Requisitos

- Node.js 22.22.3, 24.15.0 o 26+
- npm 10.9+

## Desarrollo

```bash
npm install
npm start
```

## Producción

```bash
npm run build
```

Directorio para Render Static Site:

```text
dist/pokecarddex/browser
```

En Render agrega una regla Rewrite de `/*` a `/index.html`.

## Corrección iOS: scroll del Dex

Esta versión evita que la cuadrícula vuelva hacia arriba mientras se desplaza en una PWA instalada en iPhone:

- La posición se guarda sin actualizar Angular Signals durante cada evento `scroll`.
- La restauración se ejecuta una sola vez al volver desde el detalle de un Pokémon.
- Se desactiva la restauración automática del Router para evitar dos sistemas compitiendo.
- El desplazamiento global usa comportamiento instantáneo al restaurar y no `smooth`.
