# Design System - CreditoGov

## 1. Paleta de Cores

### Cores Primárias

**Verde Confiança** (Principal)
```
Hex: #10B981
RGB: (16, 185, 129)
Uso: CTAs, validações, status positivo
```

**Azul Segurança** (Secundário)
```
Hex: #3B82F6
RGB: (59, 130, 246)
Uso: Links, informações, ícones
```

**Cinza Neutro** (Background)
```
Hex: #F9FAFB
RGB: (249, 250, 251)
Uso: Backgrounds, cards
```

### Status
- ✅ Validado: #10B981 (verde)
- ⏳ Pendente: #F59E0B (âmbar)
- ❌ Erro: #EF4444 (vermelho)
- ℹ️ Informação: #3B82F6 (azul)

---

## 2. Tipografia

### Fonte Principal: Inter

**Tamanhos:**
- Display (40px): Títulos página
- Heading 1 (32px): Seções principais
- Heading 2 (24px): Subseções
- Body (16px): Corpo texto
- Small (12px): Labels, metadados

**Pesos:** 400, 500, 600, 700

---

## 3. Espaçamento (Scale 4px)

```
xs: 4px
sm: 8px
md: 16px
lg: 24px
xl: 32px
2xl: 48px
```

---

## 4. Componentes

### Button

**Primário (Verde)**
- Background: #10B981
- Padding: 8px 16px
- Border-radius: 6px
- Hover: #059669

**Secundário (Azul)**
- Background: #3B82F6
- Padding: 8px 16px
- Hover: #2563EB

**Ghost**
- Background: transparent
- Border: 1px #D1D5DB
- Hover: #F3F4F6

---

### Card

```
Background: #FFFFFF
Border: 1px solid #E5E7EB
Border-radius: 8px
Padding: 24px
Box-shadow: 0 1px 3px rgba(0,0,0,0.1)
Hover: Box-shadow: 0 4px 6px rgba(0,0,0,0.1)
```

### Input

```
Background: #FFFFFF
Border: 1px solid #D1D5DB
Border-radius: 6px
Padding: 8px 12px
Focus: Border #3B82F6 + box-shadow
```

### Badge/Status

```
Validado: bg-green-100 text-green-800
Pendente: bg-yellow-100 text-yellow-800
Erro: bg-red-100 text-red-800
```

### Modal

```
Overlay: rgba(0, 0, 0, 0.5)
Background: #FFFFFF
Border-radius: 12px
Min-width: 400px
Padding: 32px
```

---

## 5. Ícones

**Biblioteca:** Lucide React
**Tamanho:** 20px
**Color:** inherit

---

## 6. Breakpoints

- Mobile: 320px - 640px
- Tablet: 641px - 1024px
- Desktop: 1025px+

---

## 7. Acessibilidade

- Contraste: Mínimo 4.5:1 (WCAG AA)
- Focus states: outline 2px
- Alt text: Todas imagens
- Keyboard navigation: Completa

---

## 8. CSS Variables

```css
:root {
  --color-primary: #10B981;
  --color-secondary: #3B82F6;
  --color-error: #EF4444;
  --color-bg: #F9FAFB;
  --color-surface: #FFFFFF;
  
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  
  --radius-sm: 4px;
  --radius-md: 6px;
  --radius-lg: 8px;
}
```

---

**Última atualização**: Agosto 2026
