# Requisitos Funcionales – Cartera del Trader
## Sistema: Nexus

---

## Descripción del Módulo

Este módulo permite al trader gestionar los fondos disponibles en su cuenta, incluyendo depósitos, retiros, visualización de saldo y consulta del historial de transacciones.

---

## RF-CR-01 – Visualizar saldo de la cartera

### Descripción
El sistema debe permitir al trader visualizar el estado actual de su cartera.

### Actor(es)
- Trader

### Precondiciones
- Usuario autenticado

### Flujo básico

1. El sistema consulta el estado de la cartera
2. El sistema muestra:
   - saldo total
   - saldo disponible
   - saldo reservado

### Postcondiciones
- El trader conoce el estado de sus fondos
