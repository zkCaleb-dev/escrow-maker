# Escrow Maker CLI

Una herramienta profesional de línea de comandos para interactuar con Trustless Work en la blockchain de Stellar. Soporta **testnet** y **mainnet** con cambio fácil de red, gestión de múltiples wallets y workflows automáticos de testing.

## 🌟 Características

- 🌐 **Soporte multi-red**: Testnet y Mainnet
- 💼 **Gestión de múltiples wallets**: Configura diferentes wallets para diferentes roles
- 🚀 **Workflows automáticos**: Ejecuta flujos completos con un solo comando
- 🔑 **Configuración separada** por red
- 📦 **Migración automática** desde formatos de configuración antiguos
- ✅ **CLI profesional** siguiendo las mejores prácticas de la industria
- 🔒 **Almacenamiento seguro** de configuración con permisos apropiados
- 🧪 **Testing rápido**: Prueba flujos completos de escrow sin configuración manual

---

## 📥 Instalación

### Instalación Global

```bash
npm install -g .
```

### Verificar Instalación

```bash
escrow --version
escrow --help
```

---

## 🚀 Inicio Rápido

### Paso 1: Obtener Wallets de Testnet

Antes de comenzar, necesitas generar wallets de testnet válidas:

1. Visita: https://laboratory.stellar.org/#account-creator?network=test
2. Haz clic en "Generate keypair" para generar un par de claves
3. Haz clic en "Fund with Friendbot" para fondear la cuenta
4. Guarda tu **Public Key** (comienza con `G`) y **Secret Key** (comienza con `S`)

Repite este proceso para obtener 2 wallets (una principal y una para resolver disputas).

### Paso 2: Configurar API Key

Obtén tu API Key de Trustless Work:
- Para testnet: https://dev.api.trustlesswork.com
- Para mainnet: https://api.trustlesswork.com

### Paso 3: Agregar Wallets

```bash
# Agregar wallet principal
escrow wallet add main \
  --public GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX \
  --secret SXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX \
  --alias "Main Wallet"

# Agregar wallet para resolver disputas
escrow wallet add resolver \
  --public GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX \
  --secret SXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX \
  --alias "Dispute Resolver"

# Verificar wallets
escrow wallet list
```

### Paso 4: Configurar API Key

```bash
escrow config set testnet.apiKey "tu-api-key-aqui"
```

### Paso 5: ¡Ejecutar tu Primer Workflow!

```bash
# Ejecutar flujo completo de escrow single-release
escrow test-single-release

# El comando ejecutará automáticamente:
# 1. Deploy escrow
# 2. Fund escrow (10 USDC)
# 3. Change milestone status
# 4. Approve milestone
# 5. Release funds
```

---

## 📚 Documentación Completa

### 1. Gestión de Wallets

Las wallets te permiten usar diferentes cuentas de Stellar para diferentes roles (approver, dispute resolver, etc.).

#### 1.1 Listar Wallets

```bash
# Ver todas las wallets configuradas
escrow wallet list

# Ver wallets de una red específica
escrow wallet list -n mainnet
```

**Salida:**
```
💼 Wallets for testnet:

  ✓ main
    Alias: Main Wallet
    Public: GB6MP3L6UGIDY6O6MXNLSKHLXT2T2TCMPZIZGUTOGYKOLHW7EORWMFCK
    Secret: SXJFWK4N...HCN3
    (default)

    resolver
    Alias: Dispute Resolver
    Public: GD7XY9ZPMN8WXYZ123...
    Secret: SYABCD12...XYZ9
```

#### 1.2 Mostrar Detalles de una Wallet

```bash
escrow wallet show main
escrow wallet show resolver -n mainnet
```

#### 1.3 Agregar una Wallet

```bash
escrow wallet add <nombre> \
  --public <public-key> \
  --secret <secret-key> \
  --alias "Nombre descriptivo"

# Ejemplos:
escrow wallet add alice \
  --public GB6MP3L6UGIDY6O6MXNLSKHLXT2T2TCMPZIZGUTOGYKOLHW7EORWMFCK \
  --secret SXJFWK4NJYTW66M2ZKOKK7I4LWLVJFEKPLGTM6AM2NN2LAJZANMKHCN3 \
  --alias "Alice's Wallet"

# Para mainnet
escrow wallet add bob \
  --public GA... \
  --secret SA... \
  --alias "Bob - Mainnet" \
  -n mainnet
```

#### 1.4 Eliminar una Wallet

```bash
# Eliminar wallet (requiere confirmación)
escrow wallet remove alice

# Eliminar sin confirmación
escrow wallet remove alice --yes
```

#### 1.5 Establecer Wallet por Defecto

```bash
escrow wallet set-default main
escrow wallet set-default resolver -n mainnet
```

---

### 2. Comandos de Workflow (Testing Automático)

Los workflows ejecutan flujos completos de escrow automáticamente, perfectos para testing.

#### 2.1 Test Single-Release (Flujo Exitoso)

Ejecuta un flujo completo desde deploy hasta release:

```bash
# Uso básico (cero configuración)
escrow test-single-release

# Con opciones personalizadas
escrow test-single-release \
  --amount 200000000 \
  --wallet main \
  --network testnet \
  --env dev \
  -v
```

**Opciones:**
- `--amount <stroops>`: Cantidad a fondear (default: 100000000 = 10 USDC)
- `--wallet <nombre>`: Wallet a usar (default: main)
- `-n, --network <red>`: Red a usar (default: testnet)
- `--env <entorno>`: Entorno: local o dev (default: dev)
- `-v, --verbose`: Salida detallada

**Lo que hace:**
```
[1/5] Deploy escrow          → Despliega contrato single-release
[2/5] Fund escrow            → Fondea con la cantidad especificada
[3/5] Change status          → Cambia status del milestone a "completed"
[4/5] Approve milestone      → Aprueba el milestone
[5/5] Release funds          → Libera los fondos al receiver
```

#### 2.2 Test Single-Dispute (Flujo con Disputa)

Ejecuta un flujo completo con disputa usando **2 wallets diferentes**:

```bash
# Uso básico
escrow test-single-dispute

# Con opciones personalizadas
escrow test-single-dispute \
  --amount 150000000 \
  --wallet main \
  --resolver-wallet resolver \
  --split 30:70 \
  -v
```

**Opciones:**
- `--amount <stroops>`: Cantidad a fondear (default: 100000000)
- `--wallet <nombre>`: Wallet principal (default: main)
- `--resolver-wallet <nombre>`: Wallet que resuelve la disputa (default: resolver)
- `--split <ratio>`: División de fondos como 30:70 (default: 50:50)
- `-n, --network <red>`: Red a usar
- `--env <entorno>`: Entorno
- `-v, --verbose`: Salida detallada

**Lo que hace:**
```
[1/4] Deploy escrow          → Despliega con disputeResolver = resolver wallet
[2/4] Fund escrow            → Fondea (wallet: main)
[3/4] Dispute escrow         → Inicia disputa (wallet: main)
[4/4] Resolve dispute        → Resuelve disputa (wallet: resolver) ⚡
       - Approver: 50%
       - Receiver: 50%
```

**⚡ Importante:** Este workflow usa 2 wallets diferentes:
- `--wallet main`: Para deploy, fund y dispute
- `--resolver-wallet resolver`: Para resolver la disputa

---

### 3. Comandos Individuales

Comandos para ejecutar operaciones específicas en contratos existentes.

#### 3.1 Fund (Fondear Escrow)

```bash
escrow fund <contractId> [opciones]

# Ejemplos:
escrow fund CAZ6UQX7PQXYZ123... --amount 100000000
escrow fund CAZ6UQX7PQXYZ123... --amount 50000000 --wallet alice -v
```

**Opciones:**
- `--amount <stroops>`: Cantidad a fondear (default: 100000000)
- `--wallet <nombre>`: Wallet a usar
- `-n, --network`: Red
- `--env`: Entorno
- `-v, --verbose`: Salida detallada

#### 3.2 Approve (Aprobar Milestone)

```bash
escrow approve <contractId> [opciones]

# Ejemplos:
escrow approve CAZ6UQX7... --milestone 0
escrow approve CAZ6UQX7... --milestone 1 --wallet approver -v
```

**Opciones:**
- `--milestone <index>`: Índice del milestone (default: 0)
- `--wallet <nombre>`: Wallet del approver
- `-n, --network`: Red
- `-v, --verbose`: Salida detallada

#### 3.3 Change-Status (Cambiar Status del Milestone)

```bash
escrow change-status <contractId> [opciones]

# Ejemplos:
escrow change-status CAZ6UQX7... --milestone 0 --status completed
escrow change-status CAZ6UQX7... \
  --milestone 0 \
  --status completed \
  --evidence "https://github.com/pr/123" \
  --wallet service-provider
```

**Opciones:**
- `--milestone <index>`: Índice del milestone (default: 0)
- `--status <status>`: Nuevo status (default: completed)
- `--evidence <texto>`: Evidencia URL o texto
- `--wallet <nombre>`: Wallet del service provider
- `-v, --verbose`: Salida detallada

---

### 4. Comandos de Deploy

Despliega nuevos contratos de escrow.

#### 4.1 Deploy Single-Release

```bash
escrow deploy-single [opciones]

# Ejemplos:
escrow deploy-single
escrow deploy-single -n mainnet -v
escrow deploy-single --wallet main --env dev
```

**Lo que hace:**
1. Crea un contrato single-release
2. Firma la transacción
3. Envía la transacción a la blockchain
4. Retorna el Contract ID

#### 4.2 Deploy Multi-Release

```bash
escrow deploy-multi [opciones]

# Ejemplos:
escrow deploy-multi
escrow deploy-multi -n mainnet
```

**Diferencia:** Multi-release permite liberar fondos por milestone individual.

---

### 5. Gestión de Redes

Cambia entre testnet y mainnet fácilmente.

#### 5.1 Listar Redes

```bash
escrow network list
```

**Salida:**
```
📡 Available networks:

  ✓ testnet (active)
    Passphrase: Test SDF Network ; September 2015
    Base URL: https://dev.api.trustlesswork.com

    mainnet
    Passphrase: Public Global Stellar Network ; September 2015
    Base URL: https://api.trustlesswork.com
```

#### 5.2 Ver Red Actual

```bash
escrow network current
```

#### 5.3 Cambiar Red por Defecto

```bash
escrow network use testnet
escrow network use mainnet
```

#### 5.4 Ver Configuración de una Red

```bash
escrow network show testnet
escrow network show mainnet
```

---

### 6. Gestión de Configuración

Configura credenciales y URLs.

#### 6.1 Ver Configuración

```bash
# Ver toda la configuración
escrow config list

# Ver configuración de una red
escrow config list testnet
escrow config list mainnet
```

#### 6.2 Establecer Valores

```bash
# Configurar API Key
escrow config set testnet.apiKey "tu-api-key"
escrow config set mainnet.apiKey "tu-api-key-mainnet"

# Configurar URLs (opcional, ya vienen por defecto)
escrow config set testnet.baseUrlDev "https://dev.api.trustlesswork.com"
escrow config set mainnet.baseUrlDev "https://api.trustlesswork.com"
```

#### 6.3 Obtener un Valor

```bash
escrow config get testnet.apiKey
```

#### 6.4 Eliminar un Valor

```bash
escrow config unset testnet.apiKey
```

---

### 7. Comandos de Firma (Avanzado)

Para casos de uso avanzados donde necesitas firmar XDRs manualmente.

#### 7.1 Sign (Solo Firmar)

```bash
escrow sign <xdr> [opciones]

# Ejemplo:
escrow sign "AAAAAgAAAAC..." -n testnet
```

#### 7.2 Sign-Send (Firmar y Enviar)

```bash
escrow sign-send <xdr> [opciones]

# Ejemplo:
escrow sign-send "AAAAAgAAAAC..." --env dev -n testnet
```

---

## 🔧 Estructura de Configuración

Tu configuración se almacena en `~/.escrow/config.json`:

```json
{
  "defaultNetwork": "testnet",
  "networks": {
    "testnet": {
      "name": "testnet",
      "networkPassphrase": "Test SDF Network ; September 2015",
      "apiKey": "tu-api-key",
      "horizonUrl": "https://horizon-testnet.stellar.org",
      "baseUrlLocal": "http://localhost:3000",
      "baseUrlDev": "https://dev.api.trustlesswork.com",

      "wallets": {
        "main": {
          "alias": "Main Wallet",
          "publicKey": "GB6MP3L6...",
          "secretKey": "SXJFWK4N..."
        },
        "resolver": {
          "alias": "Dispute Resolver",
          "publicKey": "GD7XY9Z...",
          "secretKey": "SYABCD..."
        }
      },

      "defaultWallet": "main",

      "testDefaults": {
        "amount": 100000000,
        "disputeSplit": "50:50",
        "milestoneIndex": 0,
        "milestones": 2,
        "multiAmounts": "50000000,50000000"
      }
    },
    "mainnet": {
      // Estructura similar para mainnet
    }
  }
}
```

---

## 📊 Jerarquía de Configuración

El CLI usa el siguiente orden de prioridad:

1. **Flags CLI** (mayor prioridad)
   ```bash
   escrow test-single-release --amount 200000000 --wallet alice
   ```

2. **Variables de entorno**
   ```bash
   export ESCROW_NETWORK=mainnet
   export ESCROW_API_KEY=tu-api-key
   ```

3. **Archivo de configuración** (`~/.escrow/config.json`)

4. **Valores por defecto** (menor prioridad)

---

## 🌍 Variables de Entorno

Útiles para CI/CD o overrides temporales:

```bash
# Establecer red
export ESCROW_NETWORK=mainnet

# Establecer credenciales
export ESCROW_API_KEY=tu-api-key
export ESCROW_PUBLIC_KEY=GB...
export ESCROW_SECRET_KEY=SB...

# Ahora los comandos usarán estos valores
escrow test-single-release
```

---

## 💡 Casos de Uso Comunes

### Caso 1: Testing Rápido de Flujo Completo

```bash
# 1. Configurar wallets (solo una vez)
escrow wallet add main --public GB... --secret SB...
escrow config set testnet.apiKey "key"

# 2. Ejecutar workflow
escrow test-single-release

# ¡Listo! El flujo completo se ejecuta automáticamente
```

### Caso 2: Probar Flujo de Disputa con 2 Wallets

```bash
# 1. Configurar ambas wallets
escrow wallet add main --public GB... --secret SB... --alias "Main"
escrow wallet add resolver --public GD... --secret SD... --alias "Resolver"
escrow config set testnet.apiKey "key"

# 2. Ejecutar workflow de disputa
escrow test-single-dispute

# El flujo usa automáticamente las 2 wallets:
# - main: para deploy, fund, dispute
# - resolver: para resolver la disputa
```

### Caso 3: Deploy Manual + Operaciones Individuales

```bash
# 1. Deploy
escrow deploy-single -v
# Obtener Contract ID: CAZ6UQX7...

# 2. Fund
escrow fund CAZ6UQX7... --amount 100000000

# 3. Change status
escrow change-status CAZ6UQX7... --milestone 0 --status completed

# 4. Approve
escrow approve CAZ6UQX7... --milestone 0

# 5. Release (implementar comando si es necesario)
```

### Caso 4: Testing con Diferentes Cantidades

```bash
# Test con 5 USDC
escrow test-single-release --amount 50000000

# Test con 100 USDC
escrow test-single-release --amount 1000000000

# Test con split personalizado en disputa
escrow test-single-dispute --amount 100000000 --split 20:80
```

### Caso 5: Usar Diferentes Wallets

```bash
# Agregar múltiples wallets
escrow wallet add alice --public GB... --secret SB...
escrow wallet add bob --public GC... --secret SC...
escrow wallet add charlie --public GD... --secret SD...

# Ejecutar con wallet específica
escrow test-single-release --wallet alice
escrow test-single-release --wallet bob

# Disputas con diferentes resolvers
escrow test-single-dispute --wallet alice --resolver-wallet charlie
```

---

## 🔒 Mejores Prácticas de Seguridad

1. **Nunca commitees** tu archivo `~/.escrow/config.json`
2. **Usa claves diferentes** para testnet y mainnet
3. **Verifica la red** antes de ejecutar operaciones:
   ```bash
   escrow network current
   ```
4. **Prueba en testnet** antes de usar mainnet
5. **Usa verbose mode** (`-v`) para verificar antes de operaciones importantes
6. **Mantén backups** de tus secret keys en un lugar seguro
7. **No compartas** tus secret keys con nadie

---

## 🐛 Solución de Problemas

### Error: "Wallet not found"

```bash
# Verificar wallets configuradas
escrow wallet list

# Agregar la wallet faltante
escrow wallet add main --public GB... --secret SB...
```

### Error: "Missing required configuration: apiKey"

```bash
# Configurar API key
escrow config set testnet.apiKey "tu-api-key"
```

### Error: "Invalid Secret Key format"

- Verifica que tu secret key comience con `S`
- Verifica que tenga exactamente 56 caracteres
- Genera una nueva en: https://laboratory.stellar.org/#account-creator?network=test

### El comando ejecuta en la red incorrecta

```bash
# Verificar red actual
escrow network current

# Cambiar red
escrow network use testnet

# O usar flag -n para override
escrow test-single-release -n testnet
```

### Ver configuración completa para debugging

```bash
# Ver toda la configuración
escrow config list

# Ver configuración de testnet
escrow config list testnet

# Ver wallets
escrow wallet list

# Ejecutar con verbose
escrow test-single-release -v
```

---

## 📖 Documentación Adicional

Para más información sobre las estructuras de datos de escrow, consulta:

- `docs/escrow-structure.md` - Estructuras de datos completas
- `docs/single-release-example.json` - Ejemplo de payload single-release
- `docs/multi-release-example.json` - Ejemplo de payload multi-release

---

## 🤝 Contribuir

Issues y pull requests son bienvenidos en: https://github.com/zkCaleb-dev/Escrow-Maker

---

## 📄 Licencia

ISC

---

## 👤 Autor

zkCaleb-dev

---

## 🎯 Roadmap

- [x] Soporte multi-red (testnet/mainnet)
- [x] Gestión de múltiples wallets
- [x] Workflows automáticos de testing
- [x] Comandos individuales de operaciones
- [ ] Workflows multi-release
- [ ] Comandos de consulta (get escrow info)
- [ ] Soporte para custom contracts
- [ ] Modo interactivo (prompts)
- [ ] Export de reportes
