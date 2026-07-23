# Debug Session: resource-create-500
- **Status**: [OPEN]
- **Issue**: Al crear vehículos, agenda y recepción aparece error 500; además el selector/listado de cliente muestra código en vez de nombre y apellido.
- **Debug Server**: Pending
- **Log File**: Pending

## Reproduction Steps
1. Iniciar sesión con un usuario válido.
2. Ir a `Vehículos`, `Agenda` o `Recepción`.
3. Abrir el modal de alta.
4. Intentar crear el registro y observar el error 500.
5. Revisar cómo se renderiza el cliente en los selects/listados.

## Hypotheses & Verification
| ID | Hypothesis | Likelihood | Effort | Evidence |
|----|------------|------------|--------|----------|
| A | Los módulos `vehicles`, `turns` y `receptions` están enviando `clientId`/`vehicleId` válidos en UI, pero el backend rechaza la relación por datos fuera del tenant actual. | High | Med | Pending |
| B | El helper reusable `ResourceCrudPanel` o la configuración de `mapOption` usa `id` como label por defecto, por eso el cliente aparece como código y no como nombre completo. | High | Low | Pending |
| C | Algún campo requerido del payload (`clientId`, `vehicleId`, `startDate`, etc.) se serializa vacío o con formato incorrecto y Prisma termina lanzando 500. | High | Med | Pending |
| D | Los endpoints comparten una validación/consulta común (`findOwnedRecord`, `createResource`, soporte de options) que está fallando en cascada para varios recursos. | High | Med | Pending |
| E | La carga de soporte (`supportEndpoints`) devuelve datos incompletos para clientes/vehículos y deja selects inconsistentes, causando tanto labels incorrectos como submit inválido. | Med | Med | Pending |

## Log Evidence
- Pending

## Verification Conclusion
- Pending
