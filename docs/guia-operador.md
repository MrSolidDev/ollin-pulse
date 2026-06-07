# OLLIN Pulse - Guia de usuario para operador

Esta guia explica como preparar y operar OLLIN Pulse durante una partida en vivo. La app tiene dos ventanas principales:

- **Operador**: panel de control privado para cargar preguntas, controlar escenas, revelar respuestas y asignar puntos.
- **Pantalla publica**: salida visual para el publico o proyector. Se actualiza automaticamente con las acciones del operador.

## 1. Antes de iniciar el evento

### Verificar ventanas

1. Abre OLLIN Pulse.
2. Confirma que aparezca la ventana **OLLIN Pulse - Operador**.
3. Confirma que la ventana **OLLIN Pulse - Pantalla Publica** este visible en el monitor, pantalla LED o proyector correcto.
4. En la vista del operador, revisa el panel **Preview actual** para confirmar que la pantalla publica muestra la escena esperada.

### Elegir modo de juego

En el panel **Partida**, selecciona el modo:

| Modo | Uso recomendado | Multiplicadores |
| --- | --- | --- |
| **3 rondas** | Partida corta o evento agil | Ronda 1 x1, ronda 2 x2, ronda 3 x3 |
| **5 rondas** | Partida extendida | Rondas 1-2 x1, rondas 3-4 x2, ronda 5 x3 |
| **Muerte subita** | Desempate o dinamica rapida | Una sola ronda x1 |

> Si cambias el modo, los puntos de las preguntas se recalculan automaticamente segun la ronda.

### Nombrar equipos

1. En el panel **Equipos**, escribe el nombre del **Equipo A** y del **Equipo B**.
2. Presiona **Guardar nombres**.
3. Verifica en el panel **Estado** que los nombres aparezcan correctamente.

## 2. Cargar preguntas

### Cargar archivo CSV/XLSX

1. En el panel **Preguntas**, presiona **Cargar CSV/XLSX**.
2. Selecciona un archivo `.csv`, `.xlsx` o `.xls`.
3. Si la carga fue correcta, el panel mostrara cuantas preguntas fueron cargadas.
4. Si hay errores, apareceran en la misma seccion indicando la fila y el problema.

### Formato requerido del archivo

La app lee la primera hoja del archivo y espera estas columnas:

| Columna | Obligatoria | Descripcion |
| --- | --- | --- |
| `round` | Si | Numero de ronda a la que pertenece la pregunta. |
| `question` | Si | Texto de la pregunta. |
| `answer_1` | Si | Primera respuesta. |
| `answer_2` | Si | Segunda respuesta. |
| `answer_3` | No | Tercera respuesta, si aplica. |
| `answer_4` | No | Cuarta respuesta, si aplica. |
| `answer_5` | No | Quinta respuesta, si aplica. |
| `answer_6` | No | Sexta respuesta, si aplica. |
| `answer_7` | No | Septima respuesta, si aplica. |
| `answer_8` | No | Octava respuesta, si aplica. |

Cada pregunta debe tener **minimo 2 respuestas y maximo 8 respuestas**. Las respuestas vacias no se cuentan.

Ejemplo:

| round | question | answer_1 | answer_2 | answer_3 | answer_4 | answer_5 | answer_6 | answer_7 | answer_8 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Que haces al llegar a casa? | Dormir | Comer | Ver TV | Banarme | Descansar | Usar celular |  |  |
| 2 | Menciona algo que no puede faltar en un evento. | Musica | Comida | Bebidas | Invitados | Luces | Fotos | Premios | Pantallas |

### Usar datos de prueba

El boton **Datos mock** carga preguntas de prueba. Usalo solo para ensayos, pruebas tecnicas o capacitacion.

## 3. Iniciar partida

1. Verifica que el modo, equipos y preguntas esten listos.
2. En el panel **Partida**, presiona **Iniciar**.
3. La pantalla publica mostrara la introduccion.
4. Usa **Siguiente escena** para avanzar al intro de ronda y despues al tablero de pregunta.

El boton **Iniciar** solo se habilita cuando hay preguntas cargadas y todas tienen entre 2 y 8 respuestas.

## 4. Operacion durante la ronda

### Seleccionar pregunta

En el panel **Preview siguiente** se muestran las preguntas de la ronda actual.

1. Haz clic en la pregunta que se usara.
2. La app prepara la secuencia de escenas de la ronda.
3. Avanza con **Siguiente escena** hasta llegar al tablero de pregunta.

Cuando estes en el resultado de ronda y aun haya una ronda siguiente, el panel cambiara a **Preguntas ronda X**. Selecciona ahi la pregunta que quieres preparar para la siguiente ronda.

### Avanzar o retroceder escenas

Usa el panel **Controles rapidos**:

- **Siguiente escena**: avanza la pantalla publica.
- **Escena anterior**: regresa a la escena previa disponible.
- **Marcador**: manda directamente la pantalla de marcador.
- **Anunciar robo**: muestra el aviso visual de robo.
- **Mostrar X**: muestra una X visual sin sumar error a un equipo.

El panel **Timeline** muestra las escenas recientes y las escenas en cola. Sirve para confirmar en que punto va la presentacion.

### Revelar respuestas

En el panel **Revelar**:

1. Cada boton muestra numero, texto y puntos de una respuesta.
2. Haz clic en la respuesta que debe aparecer en pantalla.
3. La respuesta se revela en la pantalla publica.
4. Los puntos revelados se suman a la **Bolsa** de la ronda.

La bolsa no se asigna automaticamente a un equipo. Se acumula hasta que presiones **Gana Equipo A** o **Gana Equipo B**.

### Registrar errores

En **Controles rapidos**:

- **Error A** suma un error al Equipo A y muestra X visual.
- **Error B** suma un error al Equipo B y muestra X visual.
- **Reset errores** limpia los errores de ambos equipos.

Cada equipo puede acumular hasta 3 errores visibles.

### Robo

Cuando aplique una oportunidad de robo:

1. Presiona **Anunciar robo** para mostrar el aviso visual.
2. Opera la respuesta o el resultado de acuerdo con la dinamica del evento.
3. Si el equipo que roba gana la bolsa, presiona **Gana Equipo A** o **Gana Equipo B** segun corresponda.

## 5. Cerrar ronda y avanzar

Cuando termine la ronda:

1. Confirma que la **Bolsa** tenga los puntos correctos.
2. Presiona **Gana Equipo A** o **Gana Equipo B**.
3. La app mostrara el resultado de ronda y sumara la bolsa al marcador del equipo ganador.
4. Si hay mas rondas, selecciona la pregunta de la siguiente ronda cuando el panel lo indique.
5. Presiona **Siguiente escena** para iniciar la siguiente ronda.

Si vuelves a asignar la misma ronda a otro equipo, la app resta la asignacion anterior y actualiza el marcador con el nuevo ganador de ronda.

## 6. Finalizar partida

Para cerrar la partida:

1. Presiona **Finalizar** en el panel **Partida**.
2. La pantalla publica mostrara el ganador final si hay diferencia de puntos.
3. Si los equipos empatan, la app no marca ganador automaticamente.

Para iniciar otra partida desde cero, presiona **Reset**. Esto limpia modo, equipos, preguntas cargadas, rondas, errores, marcador y escenas.

## 7. Atajos de teclado

Estos atajos funcionan mientras el foco no este dentro de un campo de texto o selector:

| Tecla | Accion |
| --- | --- |
| `Espacio` | Siguiente escena |
| `Backspace` | Escena anterior |
| `1` a `8` | Revelar respuesta por numero |
| `Q` | Error del Equipo A |
| `P` | Error del Equipo B |
| `R` | Anunciar robo |

## 8. Referencia rapida de paneles

| Panel | Para que sirve |
| --- | --- |
| **Partida** | Elegir modo, iniciar, finalizar o reiniciar la partida. |
| **Equipos** | Cambiar nombres de los equipos. |
| **Controles rapidos** | Avanzar escenas, mostrar marcador, robo, X y errores. |
| **Timeline** | Ver escena actual, historial reciente y cola de escenas. |
| **Preview actual** | Revisar lo que se esta mostrando en pantalla publica. |
| **Preview siguiente / Preguntas ronda X** | Elegir pregunta actual o preparar la siguiente ronda. |
| **Preguntas** | Importar archivo o cargar datos de prueba. |
| **Revelar** | Revelar respuestas y asignar la bolsa. |
| **Estado** | Revisar puntaje, errores y bolsa actual. |

## 9. Problemas comunes

### El boton Iniciar esta deshabilitado

Revisa que:

- Se hayan cargado preguntas.
- Todas las preguntas tengan entre 2 y 8 respuestas.
- El archivo no tenga errores de importacion.

### La app muestra errores al importar

Revisa la fila indicada por el mensaje. Los problemas mas comunes son:

- Falta el numero de ronda en `round`.
- Falta el texto de `question`.
- La pregunta tiene menos de 2 respuestas.
- La pregunta tiene mas de 8 respuestas.
- Los nombres de columnas no coinciden con el formato requerido.

### No aparece una pregunta para la ronda

Confirma que el archivo tenga preguntas con el numero de ronda correcto. Por ejemplo, en modo **3 rondas** deben existir preguntas para las rondas 1, 2 y 3.

### La pantalla publica no cambia

1. Revisa el **Preview actual** en el operador.
2. Presiona **Siguiente escena** una vez mas.
3. Si la pantalla publica sigue sin actualizarse, reinicia la app y vuelve a cargar las preguntas.

### Se asignaron puntos al equipo equivocado

Presiona el boton **Gana** del equipo correcto. La app corrige la asignacion de la ronda y actualiza el marcador.

### Hay errores visuales acumulados de la ronda anterior

Presiona **Reset errores**. Al avanzar a una nueva ronda, la app tambien limpia los errores de ambos equipos.

## 10. Checklist para el operador

Antes de abrir puertas:

- Pantalla publica en el monitor correcto.
- Preview actual visible en operador.
- Modo de juego seleccionado.
- Nombres de equipos cargados.
- Archivo de preguntas importado sin errores.
- Boton **Iniciar** habilitado.
- Ensayo rapido con **Datos mock** solo si se requiere prueba tecnica.

Durante la partida:

- Avanzar escenas con calma.
- Confirmar pregunta antes de mostrarla.
- Revelar respuestas por numero.
- Verificar bolsa antes de asignar ganador.
- Preparar pregunta de la siguiente ronda al aparecer el resultado.

Al final:

- Presionar **Finalizar**.
- Confirmar ganador en pantalla publica.
- Presionar **Reset** solo cuando ya no se necesite conservar el estado de la partida.
