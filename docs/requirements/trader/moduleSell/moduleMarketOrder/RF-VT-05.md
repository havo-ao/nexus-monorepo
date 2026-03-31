## RF-VT-05 – Ejecutar venta en mercado abierto

### Descripción  
El sistema debe ejecutar la venta de acciones cuando el mercado está abierto.

### Actor(es)  
- Sistema  

### Flujo básico  

1. El sistema ejecuta la orden  
2. Actualiza el portafolio del trader  
3. Aumenta el saldo disponible  
4. Calcula la comisión  

Distribución:

- 40% comisionista (si existe)  
- 60% Nexus  
- o 100% Nexus  

5. El sistema notifica al usuario  