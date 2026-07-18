# Debug Session: home-500-error
- **Status**: [OPEN]
- **Issue**: `http://localhost:3000` y `http://localhost:3001` responden `500 Internal Server Error`.
- **Debug Server**: Pending startup
- **Log File**: `.dbg/trae-debug-log-home-500-error.ndjson`

## Reproduction Steps
1. Abrir `http://localhost:3000`.
2. Abrir `http://localhost:3001`.
3. Observar respuesta `500 Internal Server Error`.

## Hypotheses & Verification
| ID | Hypothesis | Likelihood | Effort | Evidence |
|----|------------|------------|--------|----------|
| A | El error viene de `BrandLogo` o del nuevo asset cargado por `next/image` en tiempo de desarrollo. | High | Low | Pending |
| B | El dev server activo quedó en estado inconsistente por hot reload y está devolviendo 500 aunque `next build` pase. | High | Low | Pending |
| C | Hay una diferencia entre el proceso en `3000` y el de `3001`, y uno de ellos no corresponde a este repo. | Medium | Low | Pending |
| D | La home o demo disparan una excepción durante SSR por acceso a asset/metadata no disponible en runtime. | Medium | Medium | Pending |
| E | La respuesta 500 proviene de un error de dev overlay/cache y no de una falla de compilación real. | Medium | Low | Pending |

## Log Evidence
- `localhost:3000` responde `500`, pero el proceso escuchando (`PID 4140`) corre desde `C:\Users\merca\OneDrive\Documents\TallerSaas\node_modules\next\dist\server\lib\start-server.js`.
- `localhost:3001` responde `500` y el proceso escuchando (`PID 8272`) corre desde `C:\Users\merca\Documents\TallerSaas\node_modules\next\dist\server\lib\start-server.js`.
- Respuesta de `localhost:3001`:
  - `Cannot find module './8948.js'`
  - Stack apunta a `C:\Users\merca\Documents\TallerSaas\.next\server\webpack-runtime.js`
  - El fallo ocurre en runtime de desarrollo, no en `next build`.

## Verification Conclusion
- **A**: Rechazada. No hay evidencia de que `BrandLogo` sea la causa raíz.
- **B**: Confirmada. El dev server del repo actual quedó en estado inconsistente/caché corrupta.
- **C**: Confirmada. `3000` y `3001` no están sirviendo el mismo árbol del proyecto.
- **D**: Rechazada. El build de producción compila; el error viene del runtime de desarrollo y del directorio `.next`.
- **E**: Confirmada. El problema está en el entorno de desarrollo/caché, no en la compilación de producción.
