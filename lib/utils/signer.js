// lib/utils/signer.js

// 1) Importa el SDK una sola vez, con el nombre que usarás en todo el archivo:
const StellarSDK = require('@stellar/stellar-sdk');

/**
 * signTransaction:
 *   - Recibe un XDR (base64) sin firmar, lo parsea a un objeto Transaction,
 *     lo firma con la secretKey y devuelve el XDR firmado en base64.
 *
 * Nota: Retorna siempre una cadena (si todo va bien) o lanza un error si algo falla.
 *
 * @param {string} unsignedXdr       El XDR sin firmar, en base64.
 * @param {string} secretKey         La clave secreta (secretKey) del firmante.
 * @param {string} networkPassphrase El network passphrase (testnet o mainnet).
 * @returns {string}                 El XDR firmado en base64.
 * @throws {Error}                   Si ocurre un fallo al parsear, firmar o serializar.
 */
function signTransaction(unsignedXdr, secretKey, networkPassphrase) {
  try {
    // Validar que networkPassphrase esté presente
    if (!networkPassphrase) {
      throw new Error('Network passphrase is required');
    }

    const txEnvelope = StellarSDK.xdr.TransactionEnvelope.fromXDR(unsignedXdr, 'base64');
    const transaction = new StellarSDK.Transaction(txEnvelope, networkPassphrase);

    let keypair;
    try {
      keypair = StellarSDK.Keypair.fromSecret(secretKey);
    } catch (err) {
      throw new Error(`Secret Key inválida: ${err.message}`);
    }

    transaction.sign(keypair);

    return transaction.toXDR('base64');
  } catch (err) {
    throw new Error(`Error signing transaction: ${err.message}`);
  }
}

/**
 * signXdr:
 *   - Alias de signTransaction, por compatibilidad con implementaciones anteriores.
 *     Simplemente reenvía los mismos parámetros a signTransaction.
 *
 * @param {string} xdrBase64         El XDR sin firmar, en base64.
 * @param {string} secretKey         La clave secreta (secretKey) del firmante.
 * @param {string} networkPassphrase El network passphrase (testnet o mainnet).
 * @returns {string}                 El XDR firmado en base64.
 * @throws {Error}                   Si ocurre cualquier fallo.
 */
function signXdr(xdrBase64, secretKey, networkPassphrase) {
  // Simplemente llamamos a signTransaction internamente,
  // porque ambas funciones hacen exactamente lo mismo.
  return signTransaction(xdrBase64, secretKey, networkPassphrase);
}

module.exports = { signTransaction, signXdr };
