# Requisitos Funcionales – Compra de Acciones (Limit Order)  
## Sistema: Nexus

---

## Descripción del Módulo

Este módulo permite al trader realizar compras mediante órdenes limitadas, estableciendo un precio máximo al cual está dispuesto a adquirir una acción.

---

## RF-CL-01 – Definir límite de compra

### Descripción  
El sistema debe permitir al trader definir el precio límite al cual desea comprar una acción.

### Actor(es)  
- Trader  

### Precondiciones  
- El usuario accede a la sección de compra  

### Flujo básico  
1. El usuario selecciona opción "Limit Order"  
2. El sistema solicita:
   - precio límite  
   - cantidad de acciones  
3. El sistema calcula:
   - subtotal estimado  
   - comisión  
   - total estimado  

### Flujos alternos  
- 2A. Datos inválidos  
  - El sistema solicita corrección  

### Reglas de negocio  
- RN-CL-01: La orden solo se ejecutará si el precio de mercado es igual o inferior al límite definido  
