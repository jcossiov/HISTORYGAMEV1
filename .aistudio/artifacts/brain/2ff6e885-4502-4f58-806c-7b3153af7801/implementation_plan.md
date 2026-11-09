# History Game 3D: Optimización Móvil Completa y Control Estricto de Faltas del Árbitro

## 1. Cambios Realizados

### A. Optimización Táctil Completa para Celulares (Mobile HUD & Touch Gamepad)
- **Controles en Pantalla Intuitivos para Niños**: Se implementó una interfaz ergonómica de doble pulgar sin interferir con la vista 3D:
  - **Zona Pulgar Izquierdo**:
    - **D-Pad Virtual Táctil**: Botones de dirección (Arriba, Abajo, Izquierda, Derecha) con respuesta táctil instantánea, `touch-none` y prevención de arrastre o zoom accidental del navegador.
    - **Botón de Cambio Rápido de Héroe**: Alternancia instantánea entre **Richard** (vestido naranja) y **Juan** (vestido verde) con un solo toque desde el pulgar izquierdo.
  - **Zona Pulgar Derecho**:
    - **Botón Gigante de Disparo [K / Espacio]**: Acción primaria en rojo/rosa brillante con icono de mira.
    - **Botón de Limpiar / Buen Hábito [J]**: Acción en verde esmeralda para limpiar contaminación, salvar al león, recoger pergaminos y rescatar gallinas.
    - **Selector de Modo de Movimiento GTA**: Botones directos para entrar/salir del **Eco-Buggy [E]** y activar el **Modo Vuelo/Planeo [F]**.
    - **Perlas de Poder**: Botones con indicador de cantidad para la **Perla de Teletransporte [T]** (🔮) y la **Perla de Velocidad Nitro [Shift]** (⚡).
  - **Barra Central de Poderes Elementales**: Selector táctil horizontal directo con feedback sonoro:
    - 💧 **Agua** (Chorro de agua descontaminante)
    - ⚡ **Rayo** (Electrochoque certero)
    - 🔥 **Fuego** (Orbe de calor purificador)
    - 🏏 **Bate** (Golpe cuerpo a cuerpo de 65+ daño)
    - 🛡️ **Escudo** (Cúpula de invencibilidad)
- **HUD Superior Compacto y Responsivo**:
  - Encabezado adaptativo que no desborda en pantallas de celulares estrechas (360px a 430px).
  - 5 corazones visuales de vida para niños, barra de vida y escudo del villano, contador de tarjetas verdes 🟩, y acceso a preguntas bonus.
  - Altura fluida `h-[calc(100dvh-64px)]` que elimina el scroll vertical en navegadores móviles.

### B. Control del Silbato del Árbitro: Exclusivo para Faltas Ambientales y Éticas
- **Eliminación Total de Silbatazos Invasivos**:
  - Se eliminó el silbato de la navegación entre pestañas, del selector de niveles, de los botones del banner y de las victorias.
- **Activación Exclusiva ante Faltas ("Falta"):**
  1. **Impacto de Vertido Tóxico**: Cuando el jugador recibe daño de los proyectiles contaminantes del villano, suena el silbato y el Árbitro anuncia *"¡FALTA! ⚠️ Infracción por vertido tóxico"*.
  2. **Error en Trivia / Dilema Ético**: Si el jugador elige una respuesta no sostenible o perjudicial en la pregunta del árbitro, suena el silbato y el Árbitro pita *"¡FALTA! 🟨 Infracción en respuesta"*.
- **Ajuste Acústico Amigable**:
  - Frecuencia suave de onda senoidal de 2200Hz con modulación suave (sin estridencia ni saturación).
  - Cooldown estricto de 3.5 segundos en el sintetizador para garantizar que nunca se solape ni sature el audio del juego.
