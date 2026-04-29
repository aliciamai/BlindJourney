# Contribución a BlindJourney

## Ramas

| Rama | Uso |
|------|-----|
| `main` | Código estable y revisado |
| `dev` | Integración de nuevas funcionalidades |
| `feature/<nombre>` | Una funcionalidad nueva |
| `fix/<nombre>` | Corrección de un bug |

El flujo es siempre: `feature/*` o `fix/*` → `dev` → `main`.

## Crear una rama nueva

```bash
git checkout dev
git pull origin dev
git checkout -b feature/nombre-descriptivo
```

## Commits

Formato: `tipo: descripción breve en presente`

```
feat: añadir filtro de destinos por presupuesto
fix: corregir validación de email en registro
refactor: extraer lógica de pago a stripe.service
test: añadir test de cancelación de reserva
docs: actualizar tabla de endpoints en README
chore: actualizar dependencias
```

Tipos válidos: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`.

## Pull Request

1. Asegúrate de que los tests pasan: `npm test`
2. Sube la rama: `git push origin feature/nombre-descriptivo`
3. Abre un PR hacia `dev` en GitHub
4. Título: igual que el commit principal
5. Descripción: qué cambia y por qué; si resuelve un issue, referéncialo con `Closes #N`

No se hace merge directo a `main` sin pasar por `dev`.
