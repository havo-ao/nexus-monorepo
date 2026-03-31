## RF-NT-05 – Gestionar notificaciones de operaciones

### Descripción  
El sistema debe permitir activar o desactivar notificaciones relacionadas con operaciones de trading.

### Actor(es)  
- Trader  

### Flujo básico  
1. El sistema muestra opciones:
   - Ejecución de órdenes  
   - Limit orders  
   - Market orders en apertura  
   - Apertura/cierre de mercado  
2. El usuario configura preferencias  
3. El sistema guarda configuración  

### Flujos alternos  
- N/A  

### Postcondiciones  
- Configuración actualizada  

### Reglas de negocio  
- RN-NT-02: Las notificaciones deben indicar si la operación fue realizada por el trader o el comisionista  
- RN-NT-03: Las limit orders deben incluir el precio alcanzado  
- RN-NT-04: Las órdenes ejecutadas en apertura deben incluir el precio de apertura  
