# Story Game 🎮🌱 (Guardianes de Medellín)

Juego web 3D interactivo sobre **hábitos de vida y valores ciudadanos** para niños y jóvenes. Acompaña a **Richard** y **Juan** en una aventura a través de las etapas de la vida (Niñez, Adolescencia, Juventud, Adultez y Sabiduría) en locaciones emblemáticas de Medellín y Colombia.

Aprende jugando cómo impactar positivamente tu comunidad:
- 💧 **Cero Basura**: Usa el cañón de agua purificada para neutralizar a *El Basurote* y limpiar los parques.
- 🌳 **No a la Tala**: Defiende los bosques nativos de Santa Elena y el Parque Arví contra taladores usando aspersores y agua.
- 🤝 **Cero Violencia**: Resuelve conflictos con diálogo y juego limpio guiados por el árbitro *Don Justo*.
- 🥕 **Cero Hambre**: Siembra huertas comunitarias y comparte alimentos en comedores solidarios.

---

## ✨ Características

- **15 Capítulos en 5 Etapas de la Vida**:
  - *Niñez*: Parque Norte, La Playita Comuna 13, Parque Explora.
  - *Adolescencia*: Bosque Arví, Canchas de Moravia, Vivero La Ladera.
  - *Juventud*: Cerro Nutibara, Ruta N Innovación, Comuna 8 Huertas.
  - *Adultez*: Río Medellín / Parques del Río, Quebrada Santa Elena, Mirador de San Félix.
  - *Sabiduría*: Jardín Botánico, Plaza Botero, Pueblito Paisa.
- **Arena 3D con Three.js**:
  - Movimiento en tercera persona (teclado WASD/flechas o controles táctiles en móvil).
  - Cañón de agua, aspersores ecológicos, siembra de huertas y megáfono de mediación.
  - Misiones de recolección de basura, reforestación de árboles y protección ciudadana.
- **Taller de Robótica Comunitario**:
  - Programa robots de apoyo con bloques de lógica estilo rompecabezas.
- **Criterio Visual Awwwards**:
  - Diseño limpio, tipografía editorial (*Plus Jakarta Sans* y *Baloo 2*), *glassmorphism* refinado y sin sobrecarga de información.
- **100% Estático y Serverless**:
  - Funciona completamente en el navegador y se aloja de forma nativa en **GitHub Pages**.

---

## 🛠️ Tecnologías

- **React 19** + **TypeScript**
- **Vite 8**
- **Three.js** (gráficos y física 3D procedimental)
- **Tailwind CSS v4** + Lucide Icons + Canvas Confetti

---

## ▶️ Ejecución en Local

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev
```

Abre en tu navegador: [http://localhost:5173/](http://localhost:5173/)

---

## 📦 Compilación

```bash
npm run typecheck  # Valida tipos de TypeScript
npm run build      # Genera la build optimizada en dist/
npm run preview    # Previsualiza la build de producción
```

---

## 🌐 Publicación en GitHub Pages

El juego está desplegado en la rama `gh-pages` y disponible en:
**`https://jcossiov.github.io/HISTORYGAMEV1/`**

### Configuración en GitHub:
1. En GitHub ve a **Settings** → **Pages**.
2. En **Build and deployment > Source**, selecciona **Deploy from a branch**.
3. Selecciona la rama **`gh-pages`** y carpeta **`/ (root)`**, luego guarda (**Save**).
