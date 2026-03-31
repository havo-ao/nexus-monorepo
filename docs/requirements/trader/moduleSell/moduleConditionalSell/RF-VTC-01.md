# Requisitos Funcionales – Órdenes de Venta Condicionadas  
## Sistema: Nexus

---

## RF-VTC-01 – Crear orden Take Profit

### Descripción  
El sistema debe permitir al trader definir un precio objetivo para vender una acción con ganancia.

### Actor(es)  
- Trader  

### Flujo básico  

1. El usuario define precio objetivo  
2. El sistema valida cantidad disponible  
3. El sistema registra orden con estado `PENDIENTE`  
4. El sistema reserva las acciones asociadas  

### Reglas de negocio  

- RN-VTC-01: La orden se ejecuta si el precio de mercado es mayor o igual al valor definido  
