# Diccionario de Datos — Plataforma Nexus

Este documento describe las tablas del sistema Nexus, incluyendo sus atributos, tipos de datos sugeridos, restricciones y descripción funcional.

---

# Tabla: trader_user

| Campo | Tipo de Dato | Restricciones | Descripción |
|------|--------------|--------------|-------------|
| id | BIGINT | PK, AUTO_INCREMENT | Identificador único del trader. |
| name | VARCHAR(80) | NOT NULL | Nombre del trader. |
| surname | VARCHAR(80) | NOT NULL | Apellido del trader. |
| genre | VARCHAR(20) | NOT NULL | Género definido por el trader.(MALE, FEMALE, NON_BINARY, OTHER) |
| email | VARCHAR(120) | UNIQUE, NOT NULL | Correo electrónico utilizado para autenticación. |
| username | VARCHAR(60) | UNIQUE, NOT NULL | nombre de usuario a mostrar en la plataforma. |
| password | VARCHAR(255) | NOT NULL | Contraseña cifrada del usuario. |
| user_role | VARCHAR(20) | NOT NULL | Rol del usuario en el sistema (ADMIN, TRADER, BROKER, LEGAL_USER). |
| createdAt | TIMESTAMP(6) | NOT NULL | fecha de creacion del trader|
| updatedAt | TIMESTAMP(6) | NA | fecha de modificacion del trader|
| lastLogin | TIMESTAMP(6) | NA | ultima fecha de login del trader|
| phone | VARCHAR(12) | UNIQUE, NOT NULL | Número telefónico del trader. |
| address | VARCHAR(100) | NOT NULL | Dirección de residencia del trader. |
| nationality_code | CHAR(2) | NOT NULL | Código ISO del país de nacionalidad. |
| time_zone | VARCHAR(64) | NOT NULL | Zona horaria del usuario. |
| experience | VARCHAR(20) | NOT NULL | Nivel de experiencia en trading. |
| status | VARCHAR(20) | NOT NULL | Estado del trader (ACTIVE, SUSPENDED, UNDER_INVESTIGATION, INACTIVE). |
| is_email_verified | BOOLEAN | DEFAULT FALSE | Indica si el correo fue verificado. |
| is_phone_verified | BOOLEAN | DEFAULT FALSE | Indica si el teléfono fue verificado. |

---

# Tabla: broker_user

| Campo | Tipo de Dato | Restricciones | Descripción |
|------|--------------|--------------|-------------|
| id | BIGINT | PK, AUTO_INCREMENT | Identificador único del comisionista. |
| name | VARCHAR(80) | NOT NULL | Nombre del comisionista. |
| surname | VARCHAR(80) | NOT NULL | Apellido del comisionista. |
| genre | VARCHAR(20) | NOT NULL | Género definido por el comisionista.(MALE, FEMALE, NON_BINARY, OTHER) |
| email | VARCHAR(120) | UNIQUE, NOT NULL | Correo electrónico utilizado para autenticación. |
| username | VARCHAR(60) | UNIQUE, NOT NULL | nombre de usuario a mostrar en la plataforma. |
| password | VARCHAR(255) | NOT NULL | Contraseña cifrada del usuario. |
| user_role | VARCHAR(20) | NOT NULL | Rol del usuario en el sistema (ADMIN, TRADER, BROKER, LEGAL_USER). |
| createdAt | TIMESTAMP(6) | NOT NULL | fecha de creacion del comisionista|
| updatedAt | TIMESTAMP(6) | NA | fecha de modificacion del comisionista|
| lastLogin | TIMESTAMP(6) | NA | ultima fecha de login del comisionista|
| nationality_code | CHAR(2) | NOT NULL | Código ISO del país de nacionalidad. |
| languages | VARCHAR(120) | NOT NULL | Idiomas que domina el comisionista. |
| years_experience | INT | NOT NULL | Años de experiencia en trading. |
| risk_profile_score | DECIMAL(5,2) | NOT NULL | Puntaje del perfil de riesgo del comisionista. |
| drawdown | DECIMAL(5,2) | NOT NULL | Máxima pérdida histórica registrada. |
| retention_rate | DECIMAL(5,2) | NOT NULL | Porcentaje de retención de clientes. |
| avg_response_time | DECIMAL(5,2) | NOT NULL | Tiempo promedio de respuesta a clientes. |
| minimum_recommended_capital | DECIMAL(15,2) | NOT NULL | Capital mínimo recomendado para traders. |
| contact_channel | VARCHAR(100) | NOT NULL | Medio principal de contacto externo. |

---

# Tabla: admin_user

| Campo | Tipo de Dato | Restricciones | Descripción |
|------|--------------|--------------|-------------|
| id | BIGINT | PK | Identificador del administrador. |
| name | VARCHAR(80) | NOT NULL | Nombre del administrador. |
| surname | VARCHAR(80) | NOT NULL | Apellido del administrador. |
| genre | VARCHAR(20) | NOT NULL | Género definido por el administrador.(MALE, FEMALE, NON_BINARY, OTHER) |
| email | VARCHAR(120) | UNIQUE, NOT NULL | Correo electrónico utilizado para autenticación. |
| username | VARCHAR(60) | UNIQUE, NOT NULL | nombre de usuario a mostrar en la plataforma. |
| password | VARCHAR(255) | NOT NULL | Contraseña cifrada del usuario. |
| user_role | VARCHAR(20) | NOT NULL | Rol del usuario en el sistema (ADMIN, TRADER, BROKER, LEGAL_USER). |
| createdAt | TIMESTAMP(6) | NOT NULL | fecha de creacion del administrador|
| updatedAt | TIMESTAMP(6) | NA | fecha de modificacion del administrador|
| lastLogin | TIMESTAMP(6) | NA | ultima fecha de login del administrador|
| department | VARCHAR(80) | NOT NULL | Departamento dentro de Nexus. |
| position | VARCHAR(80) | NOT NULL | Cargo dentro de la organización. |

---

# Tabla: legal_user

| Campo | Tipo de Dato | Restricciones | Descripción |
|------|--------------|--------------|-------------|
| id | BIGINT | PK | Identificador del usuario del área legal. |
| name | VARCHAR(80) | NOT NULL | Nombre del usuario de area legal. |
| surname | VARCHAR(80) | NOT NULL | Apellido del usuario de area legal. |
| genre | VARCHAR(20) | NOT NULL | Género definido por el usuario de area legal.(MALE, FEMALE, NON_BINARY, OTHER) |
| email | VARCHAR(120) | UNIQUE, NOT NULL | Correo electrónico utilizado para autenticación. |
| username | VARCHAR(60) | UNIQUE, NOT NULL | nombre de usuario a mostrar en la plataforma. |
| password | VARCHAR(255) | NOT NULL | Contraseña cifrada del usuario. |
| user_role | VARCHAR(20) | NOT NULL | Rol del usuario en el sistema (ADMIN, TRADER, BROKER, LEGAL_USER). |
| createdAt | TIMESTAMP(6) | NOT NULL | fecha de creacion del usuario de area legal|
| updatedAt | TIMESTAMP(6) | NA | fecha de modificacion del usuario de area legal|
| lastLogin | TIMESTAMP(6) | NA | ultima fecha de login del usuario de area legal|
| department | VARCHAR(80) | NOT NULL | Departamento jurídico. |
---

# Tabla: wallet

| Campo | Tipo de Dato | Restricciones | Descripción |
|------|--------------|--------------|-------------|
| id | BIGINT | PK | Identificador de la cartera. |
| trader_id | BIGINT | FK, UNIQUE | Trader propietario de la cartera. |
| balance | DECIMAL(18,2) | NOT NULL | Saldo disponible del trader. |
| currency | VARCHAR(10) | NOT NULL | Moneda de la cartera. |
| created_at | TIMESTAMP | NOT NULL | Fecha de creación de la cartera. |
| updated_at | TIMESTAMP | NOT NULL | Última actualización del saldo. |

---

# Tabla: wallet_transaction

| Campo | Tipo de Dato | Restricciones | Descripción |
|------|--------------|--------------|-------------|
| id | BIGINT | PK | Identificador de la transacción financiera. |
| wallet_id | BIGINT | FK | Cartera asociada. |
| transaction_type | VARCHAR(30) | NOT NULL | Tipo de transacción financiera.(DEPOSIT, WITHDRAWAL, TRADE_BUY, TRADE_SELL, COMMISSION) |
| amount | DECIMAL(18,2) | NOT NULL | Monto del movimiento financiero. |
| reference_id | BIGINT | NOT NULL | Identificador de la entidad asociada. |
| created_at | TIMESTAMP | NOT NULL | Fecha de creación de la transacción. |

---

# Tabla: market_exchange

| Campo | Tipo de Dato | Restricciones | Descripción |
|------|--------------|--------------|-------------|
| id | BIGINT | PK | Identificador de la bolsa de valores. |
| name | VARCHAR(120) | NOT NULL | Nombre de la bolsa. |
| country | VARCHAR(80) | NOT NULL | País donde opera la bolsa. |
| timezone | VARCHAR(64) | NOT NULL | Zona horaria de la bolsa. |
| open_time | TIME | NOT NULL | Hora de apertura del mercado. |
| close_time | TIME | NOT NULL | Hora de cierre del mercado. |

---

# Tabla: stock

| Campo | Tipo de Dato | Restricciones | Descripción |
|------|--------------|--------------|-------------|
| id | BIGINT | PK | Identificador de la acción. |
| symbol | VARCHAR(10) | UNIQUE | Símbolo bursátil de la acción. |
| name | VARCHAR(120) | NOT NULL | Nombre de la empresa. |
| exchange_id | BIGINT | FK | Bolsa de valores a la que pertenece. |
| currency | VARCHAR(10) | NOT NULL | Moneda en la que cotiza. |
| sector | VARCHAR(80) | NULL | Sector económico. |
| industry | VARCHAR(80) | NULL | Industria específica. |

---

# Tabla: trade_order

| Campo | Tipo de Dato | Restricciones | Descripción |
|------|--------------|--------------|-------------|
| id | BIGINT | PK | Identificador de la orden. |
| trader_id | BIGINT | FK | Trader que creó la orden. |
| stock_id | BIGINT | FK | Acción involucrada. |
| order_type | VARCHAR(20) | NOT NULL | Tipo de orden (BUY o SELL). |
| order_mode | VARCHAR(20) | NOT NULL | Tipo de ejecución (MARKET, LIMIT, STOP_LOSS, TAKE_PROFIT). |
| quantity | INT | NOT NULL | Cantidad de acciones solicitadas. |
| price | DECIMAL(18,2) | NULL | Precio objetivo para la orden. |
| status | VARCHAR(20) | NOT NULL | Estado de la orden.(APPROVED, PENDING,CANCELLED,EXPIRED) |
| created_at | TIMESTAMP | NOT NULL | Fecha de creación de la orden. |
| expires_at | TIMESTAMP | NULL | Fecha de expiración de la orden. |

---

# Tabla: trade_transaction

| Campo | Tipo de Dato | Restricciones | Descripción |
|------|--------------|--------------|-------------|
| id | BIGINT | PK | Identificador de la transacción ejecutada. |
| order_id | BIGINT | FK | Orden asociada. |
| stock_id | BIGINT | FK | Acción negociada. |
| price | DECIMAL(18,2) | NOT NULL | Precio de ejecución. |
| quantity | INT | NOT NULL | Cantidad de acciones ejecutadas. |
| commission_total | DECIMAL(18,2) | NOT NULL | Comisión total generada. |
| platform_commission | DECIMAL(18,2) | NOT NULL | Comisión correspondiente a Nexus. |
| broker_commission | DECIMAL(18,2) | NOT NULL | Comisión correspondiente al comisionista. |
| executed_at | TIMESTAMP | NOT NULL | Fecha de ejecución de la transacción. |

---

# Tabla: portfolio_position

| Campo | Tipo de Dato | Restricciones | Descripción |
|------|--------------|--------------|-------------|
| id | BIGINT | PK | Identificador de la posición. |
| trader_id | BIGINT | FK | Trader propietario de la posición. |
| stock_id | BIGINT | FK | Acción en posesión. |
| quantity | INT | NOT NULL | Cantidad de acciones en el portafolio. |
| avg_buy_price | DECIMAL(18,2) | NOT NULL | Precio promedio de compra. |
| total_invested | DECIMAL(18,2) | NOT NULL | Capital invertido en esta acción. |
| last_updated | TIMESTAMP | NOT NULL | Última actualización del registro. |

---

# Tabla: broker_contract

| Campo | Tipo de Dato | Restricciones | Descripción |
|------|--------------|--------------|-------------|
| id | BIGINT | PK | Identificador del contrato. |
| trader_id | BIGINT | FK | Trader asociado al contrato. |
| broker_id | BIGINT | FK | Comisionista asociado. |
| contract_type | VARCHAR(20) | NOT NULL | Tipo de contrato (ADVISORY o OPERATION). |
| status | VARCHAR(20) | NOT NULL | Estado del contrato(NEGOTIATION,ACTIVE,CANCELLED,EXPIRED). |
| start_date | DATE | NOT NULL | Fecha de inicio del contrato. |
| end_date | DATE | NOT NULL | Fecha de finalización del contrato. |
---

# Tabla: broker_recommendation

| Campo | Tipo de Dato | Restricciones | Descripción |
|------|--------------|--------------|-------------|
| id | BIGINT | PK | Identificador de la recomendación. |
| broker_id | BIGINT | FK | Comisionista que realiza la recomendación. |
| trader_id | BIGINT | FK | Trader al que se dirige la recomendación. |
| stock_id | BIGINT | FK | Acción recomendada. |
| order_type | VARCHAR(20) | NOT NULL | Tipo de operación sugerida(MARKET, LIMIT, STOP_LOSS, TAKE_PROFIT). |
| quantity | INT | NOT NULL | Cantidad sugerida de acciones. |
| price | DECIMAL(18,2) | NULL | Precio objetivo sugerido. |
| status | VARCHAR(20) | NOT NULL | Estado de la recomendación(PENDING_APPROVAL, APPROVED ,REJECTED,EXECUTED). |
| created_at | TIMESTAMP | NOT NULL | Fecha de creación. |

---

# Tabla: subscription_plan

| Campo | Tipo de Dato | Restricciones | Descripción |
|------|--------------|--------------|-------------|
| id | BIGINT | PK | Identificador del plan. |
| name | VARCHAR(50) | UNIQUE | Nombre del plan (FREE, PREMIUM). |
| price_monthly | DECIMAL(10,2) | NOT NULL | Precio mensual del plan. |
| price_yearly | DECIMAL(10,2) | NOT NULL | Precio anual del plan. |

---

# Tabla: trader_subscription

| Campo | Tipo de Dato | Restricciones | Descripción |
|------|--------------|--------------|-------------|
| id | BIGINT | PK | Identificador de la suscripción. |
| trader_id | BIGINT | FK | Trader suscrito al plan. |
| plan_id | BIGINT | FK | Plan seleccionado. |
| start_date | DATE | NOT NULL | Fecha de inicio de la suscripción. |
| end_date | DATE | NOT NULL | Fecha de finalización de la suscripción. |
| status | VARCHAR(20) | NOT NULL | Estado de la suscripción(ACTIVE, CANCELLED, EXPIRED). |
| auto_renew | BOOLEAN | DEFAULT FALSE | Indica si la suscripción se renueva automáticamente. |

---

# Tabla: price_alert

| Campo | Tipo de Dato | Restricciones | Descripción |
|------|--------------|--------------|-------------|
| id | BIGINT | PK | Identificador de la alerta. |
| trader_id | BIGINT | FK | Trader que creó la alerta. |
| stock_id | BIGINT | FK | Acción monitoreada. |
| target_price | DECIMAL(18,2) | NOT NULL | Precio objetivo de la alerta. |
| alert_type | VARCHAR(20) | NOT NULL | Tipo de alerta (PRICE_ABOVE o PRICE_BELOW). |
| created_at | TIMESTAMP | NOT NULL | Fecha de creación de la alerta. |

---

# Tabla: notification

| Campo | Tipo de Dato | Restricciones | Descripción |
|------|--------------|--------------|-------------|
| id | BIGINT | PK | Identificador de la notificación. |
| trader_id | BIGINT | FK | Trader receptor de la notificación. |
| type | VARCHAR(30) | NOT NULL | Tipo de notificación generada(SECURITY,SUBSCRIPTION,TRADE_EXECUTED,LIMIT_ORDER_FILLED,MARKET_OPEN,MARKET_CLOSE,BROKER_RECOMMENDATION). |
| message | TEXT | NOT NULL | Contenido del mensaje de la notificación. |
| status | VARCHAR(20) | NOT NULL | Estado de la notificación (READ, UNREAD). |
| created_at | TIMESTAMP | NOT NULL | Fecha de creación de la notificación. |
| read_at | TIMESTAMP | NULL | Fecha en la que el usuario leyó la notificación. |

---

# Tabla: audit_log

| Campo | Tipo de Dato | Restricciones | Descripción |
|------|--------------|--------------|-------------|
| id | BIGINT | PK, AUTO_INCREMENT | Identificador único del registro de auditoría. |
| actor_type | VARCHAR(20) | NOT NULL | Tipo de usuario que ejecutó la acción. Valores posibles: TRADER, BROKER, ADMIN, LEGAL, SYSTEM. |
| actor_id | BIGINT | NOT NULL | Identificador del usuario que ejecutó la acción dentro de su tabla correspondiente (trader_user, broker_user, admin_user o legal_user). |
| target_type | VARCHAR(20) | NULL | Tipo de usuario afectado por la acción. Puede coincidir o no con el actor dependiendo del evento auditado. |
| target_id | BIGINT | NULL | Identificador del usuario afectado por la acción dentro de su tabla correspondiente. |
| action_type | VARCHAR(50) | NOT NULL | Acción ejecutada dentro del sistema. Ejemplos: CREATE_ORDER, EXECUTE_TRADE, UPDATE_PROFILE, CANCEL_CONTRACT, SUSPEND_USER. |
| entity_type | VARCHAR(50) | NOT NULL | Tipo de entidad afectada por la acción. Ejemplos: TRADER, BROKER_CONTRACT, TRADE_ORDER, TRADE_TRANSACTION, WALLET, WALLET_TRANSACTION, SUBSCRIPTION. |
| entity_id | BIGINT | NOT NULL | Identificador de la entidad afectada dentro de la tabla correspondiente indicada por `entity_type`. |
| timestamp | TIMESTAMP | NOT NULL | Fecha y hora exacta en la que ocurrió el evento auditado. |
| metadata | TEXT | NULL | Información adicional asociada al evento en formato estructurado (generalmente JSON) que permite registrar detalles del cambio o contexto de la operación. |
