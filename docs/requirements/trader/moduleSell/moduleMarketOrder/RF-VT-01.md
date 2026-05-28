# Requisitos Funcionales – Venta de Acciones (Market Order)  
## Sistema: Nexus

---

## Descripción del Módulo

Este módulo permite al trader vender acciones de su portafolio utilizando órdenes de mercado.

---

## RF-VT-01 – Iniciar proceso de venta

### Descripción  
El sistema debe permitir al trader iniciar la venta de una acción desde el portafolio.

### Actor(es)  
- Trader  

### Precondiciones  
- El usuario posee acciones del símbolo seleccionado  

### Flujo básico  
1. El usuario selecciona una acción  
2. El sistema muestra opciones:
   - vender cantidad específica  
   - vender todas las acciones  
