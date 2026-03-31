
## RF-CL-07 – Finalizar seguimiento al cierre del mercado

### Descripción  
El sistema debe evaluar órdenes limitadas pendientes al cierre del mercado.

### Actor(es)  
- Sistema  

### Precondiciones  
- Fin del horario operativo  

### Flujo básico  
1. El sistema identifica órdenes pendientes  
2. El sistema notifica al usuario  
3. El sistema solicita decisión:
   - continuar seguimiento  
   - cancelar orden  

### Flujos alternos  

**3A – Continuar seguimiento**

- La orden permanece en estado `PENDIENTE`

**3B – Cancelar orden**

- La orden cambia a estado `CANCELADA`
- El sistema libera fondos reservados  

### Postcondiciones  
- La orden continúa o se cancela según decisión del usuario  
