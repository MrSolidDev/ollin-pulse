# OLLIN Pulse - Presentacion general del desarrollo

OLLIN Pulse es una aplicacion de escritorio para operar una dinamica de trivia interactiva por equipos en eventos en vivo. El sistema separa el control privado del operador de la pantalla publica que ve la audiencia, permitiendo conducir rondas, revelar respuestas, administrar errores, mostrar robo de puntos y cerrar la partida con marcador final.

Este documento esta orientado a interesados en el desarrollo: clientes, produccion, stakeholders internos o equipos tecnicos que necesitan entender que hace la app, como esta pensada y que valor aporta a la activacion.

## 1. Vision general

La app resuelve una necesidad concreta de produccion: convertir una dinamica tipo concurso en una experiencia visual controlada, repetible y facil de operar.

- **Operacion centralizada**: el operador controla preguntas, escenas, marcador, errores y cierre de rondas desde una sola ventana.
- **Salida publica independiente**: la audiencia solo ve la presentacion limpia, sin controles ni informacion interna.
- **Contenido configurable**: las preguntas se importan desde CSV/XLSX, por lo que el contenido puede prepararse antes del evento.
- **Reglas automatizadas**: la app calcula puntos por ronda, acumula bolsa, limita errores y corrige asignaciones de puntos.
- **Formato adaptable**: soporta partidas de 3 rondas, 5 rondas y muerte subita.

## 2. Objetivo de la activacion

El objetivo de OLLIN Pulse es facilitar una trivia por equipos con ritmo de escenario, claridad visual y control operativo. La app permite que la produccion se concentre en la conduccion del evento, mientras el sistema mantiene sincronizados marcador, rondas, escenas y elementos visuales.

En terminos de experiencia, el desarrollo busca:

- Generar participacion del publico mediante competencia directa entre dos equipos.
- Mantener tension progresiva con multiplicadores por ronda.
- Mostrar avances visuales claros para audiencia, conductor y participantes.
- Reducir errores manuales durante una operacion en vivo.
- Permitir ensayos y cambios de contenido sin tocar codigo.

## 3. Participantes y roles

| Rol | Funcion dentro de la dinamica |
| --- | --- |
| **Operador** | Controla la aplicacion, carga preguntas, avanza escenas, revela respuestas y asigna puntos. |
| **Conductor** | Presenta la trivia, da la palabra a los equipos y mantiene el ritmo del evento. |
| **Equipo A / Equipo B** | Compiten respondiendo preguntas y acumulando puntos. |
| **Audiencia** | Sigue la dinamica en la pantalla publica, con marcador, respuestas y efectos visuales. |
| **Produccion** | Prepara contenido, valida pantallas, coordina tiempos y supervisa la ejecucion. |

## 4. Componentes principales

### Ventana de operador

Es el centro de control privado. Incluye paneles para:

- Elegir modo de juego.
- Nombrar equipos.
- Importar preguntas desde CSV/XLSX.
- Ver preview de la pantalla publica.
- Seleccionar pregunta por ronda.
- Avanzar o retroceder escenas.
- Mostrar marcador, X visual o aviso de robo.
- Revelar respuestas y asignar la bolsa.
- Consultar estado de puntaje, errores y ronda actual.

### Pantalla publica

Es la salida visual para proyector, pantalla LED o segundo monitor. Presenta:

- Intro de la dinamica.
- Intro de ronda con multiplicador.
- Tablero de pregunta y respuestas ocultas/reveladas.
- Marcador por equipo.
- Errores visibles con X.
- Aviso de robo de puntos.
- Resultado de ronda.
- Ganador final.

### Motor de juego

El motor de juego mantiene el estado central:

- Modo de partida.
- Equipos y puntuaciones.
- Rondas y multiplicadores.
- Preguntas y respuestas.
- Bolsa de puntos de la ronda.
- Errores por equipo.
- Ganador de ronda y ganador final.

### Administrador de escenas

El administrador de escenas controla lo que se muestra en pantalla publica. Maneja escena activa, escena previa, cola de escenas, timeline y overlays temporales como X o robo de puntos.

## 5. Flujo de la dinamica

1. **Preparacion**: se abren las ventanas, se elige modo, se nombran equipos y se importan preguntas.
2. **Inicio**: la pantalla publica muestra la introduccion de la trivia.
3. **Inicio de cada ronda**: se presenta el numero de ronda y el multiplicador vigente.
4. **Desarrollo de la ronda**: el operador selecciona la pregunta, revela respuestas correctas y administra errores.
5. **Robo de puntos**: cuando aplica, se muestra el aviso visual y se define si la bolsa cambia de equipo.
6. **Cierre de ronda**: el operador asigna la bolsa al equipo ganador de la ronda.
7. **Marcador**: se muestra el acumulado y se prepara la siguiente ronda.
8. **Final**: se calcula el ganador final o se mantiene empate si ambos equipos terminan igualados.

## 6. Formatos de juego

| Modo | Uso recomendado | Multiplicadores |
| --- | --- | --- |
| **3 rondas** | Activacion breve, dinamica de alto ritmo o agenda con tiempo limitado. | R1 x1, R2 x2, R3 x3. |
| **5 rondas** | Experiencia extendida con mas oportunidades de remontada. | R1-R2 x1, R3-R4 x2, R5 x3. |
| **Muerte subita** | Desempate o mecanica rapida de cierre. | Una ronda x1. |

Los multiplicadores se aplican automaticamente a los puntos de las respuestas segun la ronda y el modo seleccionado.

## 7. Sistema de preguntas y puntos

Las preguntas se cargan desde archivos CSV, XLSX o XLS. Cada fila representa una pregunta y debe incluir:

- Numero de ronda.
- Texto de pregunta.
- Entre 2 y 8 respuestas.

La aplicacion asigna puntos automaticamente por posicion de respuesta y por multiplicador de ronda. Esto evita depender de calculos manuales durante el evento.

La bolsa de la ronda se forma con los puntos de las respuestas reveladas. La bolsa no se entrega automaticamente: el operador decide que equipo gana la ronda y el sistema actualiza el marcador.

## 8. Sistema de errores

Cada equipo puede acumular hasta tres errores visibles. La app contempla dos tipos de accion:

- **Error de equipo**: suma error al Equipo A o B y muestra una X visual.
- **X visual**: muestra una X sin modificar el contador de errores.

Esto permite diferenciar entre reglas formales del juego y efectos escenicos usados por produccion.

## 9. Robo de puntos

El robo de puntos se maneja como un momento visual y operativo:

1. El operador activa el aviso de robo.
2. La pantalla publica muestra el overlay correspondiente.
3. El conductor resuelve la dinamica con los participantes.
4. El operador asigna la bolsa al equipo que corresponda.

La app no fuerza una unica regla de robo; permite que produccion adapte la decision al formato del evento.

## 10. Elementos de experiencia

OLLIN Pulse esta disenado para que la trivia se sienta como una pieza de escenario, no como una hoja de calculo proyectada.

- Pantalla publica limpia, sin controles.
- Marcador grande y legible.
- Tablero de respuestas en formato televisivo.
- Estados visuales para intro, ronda, pregunta, marcador y ganador.
- Overlays para X y robo.
- Preview dentro de la ventana del operador para evitar sorpresas en salida.
- Atajos de teclado para operar sin depender siempre del mouse.

## 11. Enfoque tecnico del desarrollo

La aplicacion esta construida como una app de escritorio con Electron, Vue 3, Pinia y TypeScript.

| Capa | Responsabilidad |
| --- | --- |
| **Electron main** | Crea las ventanas, coordina IPC y mantiene control de aplicacion de escritorio. |
| **WindowManager** | Abre la ventana de operador y la pantalla publica, detectando monitor externo cuando existe. |
| **GameController** | Administra reglas, equipos, rondas, preguntas, puntos, errores y ganador. |
| **SceneManager** | Administra escenas, transiciones, overlays y timeline. |
| **Vue renderer** | Renderiza la interfaz de operador y la pantalla publica. |
| **Pinia stores** | Sincronizan estado de juego y escenas en el frontend. |
| **QuestionImporter** | Lee archivos CSV/XLSX y valida estructura de preguntas. |

La separacion entre motor de juego, escenas e interfaz permite evolucionar reglas visuales o controles sin mezclar toda la logica en un solo componente.

## 12. Valor para interesados

Para un cliente o stakeholder, el valor principal es que la dinamica queda productizada:

- Menos dependencia de presentaciones manuales.
- Menos riesgo de errores de puntaje.
- Mayor control durante el evento.
- Reutilizacion para diferentes activaciones.
- Personalizacion de contenido sin recompilar la app.
- Base tecnica preparada para agregar identidad visual, sonidos, animaciones o nuevas mecanicas.

## 13. Alcance actual

El desarrollo actual cubre:

- Dos ventanas sincronizadas: operador y pantalla publica.
- Importacion de preguntas CSV/XLSX/XLS.
- Validacion de preguntas con 2 a 8 respuestas.
- Modos de 3 rondas, 5 rondas y muerte subita.
- Calculo automatico de puntos por multiplicador.
- Revelado de respuestas.
- Bolsa de ronda y asignacion de ganador.
- Errores por equipo y X visual.
- Robo de puntos como overlay.
- Marcador y ganador final.
- Timeline y preview de escena.
- Atajos de teclado para operacion rapida.

## 14. Posibles extensiones

El diseno actual permite plantear siguientes etapas sin rehacer la base:

- Personalizacion visual por marca o evento.
- Paquetes de sonido y animaciones.
- Temporizador por pregunta.
- Soporte para mas de dos equipos.
- Banco de preguntas administrable desde una interfaz.
- Exportacion de resultados.
- Modo ensayo con guion de produccion.
- Plantillas de dinamicas adicionales.

## 15. Cierre

OLLIN Pulse transforma una trivia por equipos en una herramienta operativa para eventos en vivo. El desarrollo combina control de produccion, presentacion publica y reglas automatizadas para entregar una experiencia clara, flexible y repetible.
