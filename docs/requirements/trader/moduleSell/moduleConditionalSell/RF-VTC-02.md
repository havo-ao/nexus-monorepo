## RF-VTC-02 – Crear orden Stop Loss

### Descripción  
El sistema debe permitir al trader definir un precio límite para evitar pérdidas mayores.

### Actor(es)  
- Trader  

### Flujo básico  

1. El usuario define precio mínimo  
2. El sistema valida cantidad disponible  
3. El sistema registra orden con estado `PENDIENTE`  
4. El sistema reserva las acciones  

### Reglas de negocio  

- RN-VTC-02: La orden se ejecuta si el precio de mercado es menor o igual al valor definido  
