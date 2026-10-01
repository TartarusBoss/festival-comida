# Festival Picnic 2026 — Módulo Comida

Este proyecto corresponde al módulo de ****Comida**** de la API REST del Festival Picnic 2026.

La API permite consultar los productos disponibles y gestionar los pedidos de comida realizados por los asistentes al festival.

## Integrantes


-   ****ValenMoraR:(Valentina Morales Restrrepo)**** configuración inicial del proyecto, entidades y flujo de pedidos de comida (consultar, crear, actualizar y cancelar pedidos).
-   ****TartarusBoss:**** consulta de productos, manejo del inventario, validaciones y apoyo en la integración del módulo.

> ****Nota sobre Git:(Matias Herrera Vanegas) **** en el historial aparece un commit realizado con la cuenta `Gabaruchan`. Esto ocurrió porque el computador de la universidad tenía iniciada sesión con esa cuenta. El commit fue realizado por ****TartarusBoss (Matías)**** y hace parte de su trabajo en este proyecto.

## Organización del proyecto

El proyecto está dividido en varias partes para mantener el código organizado:

-   `src/domain/`: contiene las entidades y las interfaces que usamos para trabajar con los datos.
-   `src/application/use-cases/`: contiene las validaciones y reglas que debe cumplir el sistema.
-   `src/infraestructure/`: contiene las rutas, controladores, repositorios y la conexión con la base de datos.
-   `src/app.ts`: se encarga de iniciar la aplicación y conectar sus diferentes partes.

## Instalación y ejecución

Para ejecutar el proyecto se necesita ****Node.js 18 o una versión posterior**** y acceso a la base de datos compartida del proyecto.

Primero se instalan las dependencias:

npm ci  

Después se debe crear un archivo `.env` a partir del archivo `.env.example` y configurar allí la conexión a la base de datos.

Para sincronizar el proyecto con la estructura actual de la base de datos:

npm run sync  

Luego se puede iniciar la API con:

npm run dev  

Por defecto, la API utiliza el puerto `3000`. Si se configura otro puerto en el archivo `.env`, se debe utilizar ese puerto para realizar las pruebas.

****Importante:**** como la base de datos es compartida, no se deben ejecutar `prisma migrate` ni `prisma db push`.

El archivo `.env` contiene información de conexión a la base de datos, por lo que ****no debe subirse a GitHub****.

## Endpoints del módulo

### Productos de comida

-   `GET /api/productos-comida` — consultar los productos disponibles.
-   `GET /api/productos-comida/:id` — consultar un producto específico.

### Pedidos de comida

-   `GET /api/pedidos-comida` — consultar los pedidos.
-   `GET /api/pedidos-comida/:id` — consultar un pedido específico.
-   `POST /api/pedidos-comida` — crear un pedido.
-   `PATCH /api/pedidos-comida/:id` — actualizar el estado de un pedido.
-   `DELETE /api/pedidos-comida/:id` — cancelar un pedido.

## Regla de negocio

Una de las reglas que implementamos es que ****un pedido que ya fue entregado no se puede cancelar****.

Esto significa que si un pedido tiene el estado `ENTREGADO`, el sistema no permite eliminarlo o cancelarlo y responde con un error.

Esta regla se encuentra en:

src/application/use-cases/DeletePedidoUseCase.ts  

Para comprobarla se puede intentar cancelar un pedido que ya tenga el estado `ENTREGADO`. El sistema debe responder con un error `409` y el pedido debe permanecer sin cambios.

## Pruebas

El proyecto incluye una suite de pruebas proporcionada para comprobar el funcionamiento de los diferentes módulos.

Por defecto, en nuestro entorno de desarrollo la API utiliza el puerto `6543`.

Para ejecutar las pruebas del módulo de comida:

node pruebas/correr.mjs comida http://localhost:6543

Las pruebas verifican, entre otras cosas, el cálculo del total de los pedidos, el manejo del stock, la validación de cantidades y la devolución del inventario cuando se cancela un pedido.