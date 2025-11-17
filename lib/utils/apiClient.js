// lib/utils/apiClient.js

const axios = require('axios');
const { signTransaction } = require('./signer');

/**
 * Cliente API centralizado para interactuar con Trustless Work API
 */
class ApiClient {
  constructor(config) {
    this.baseUrl = config.baseUrl;
    this.apiKey = config.apiKey;
    this.networkPassphrase = config.networkPassphrase;
  }

  /**
   * Hace una petición POST a un endpoint y retorna unsigned XDR
   */
  async callEndpoint(endpoint, payload) {
    try {
      const url = `${this.baseUrl}${endpoint}`;
      const response = await axios.post(url, payload, {
        headers: {
          'x-api-key': this.apiKey,
          'Content-Type': 'application/json',
        },
      });

      if (!response.data || !response.data.unsignedTransaction) {
        throw new Error('API did not return an unsignedTransaction field');
      }

      return response.data.unsignedTransaction;
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message;
      const errorDetails = err.response?.data || {};

      // Log detailed error for debugging
      if (err.response?.data) {
        console.error('\n❌ API Error Details:');
        console.error(JSON.stringify(errorDetails, null, 2));
      }

      throw new Error(`API request failed: ${errorMsg}`);
    }
  }

  /**
   * Firma y envía una transacción
   */
  async signAndSend(unsignedXdr, secretKey) {
    try {
      // 1. Firmar transacción
      const signedXdr = signTransaction(unsignedXdr, secretKey, this.networkPassphrase);

      // 2. Enviar transacción
      const sendEndpoint = `${this.baseUrl}/helper/send-transaction`;
      const response = await axios.post(
        sendEndpoint,
        { signedXdr },
        {
          headers: {
            'x-api-key': this.apiKey,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.data || !response.data.status) {
        throw new Error(`Transaction submission failed: ${JSON.stringify(response.data)}`);
      }

      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message;
      throw new Error(`Failed to sign and send transaction: ${errorMsg}`);
    }
  }

  /**
   * Ejecuta un flujo completo: llamar endpoint + firmar + enviar
   */
  async executeTransaction(endpoint, payload, secretKey, verbose = false) {
    if (verbose) {
      console.log(`📤 Calling ${endpoint}...`);
      console.log(`   Payload: ${JSON.stringify(payload, null, 2)}`);
    }

    // 1. Obtener unsigned XDR
    const unsignedXdr = await this.callEndpoint(endpoint, payload);

    if (verbose) {
      console.log(`✅ Received unsigned XDR`);
      console.log(`🔏 Signing transaction...`);
    }

    // 2. Firmar y enviar
    const result = await this.signAndSend(unsignedXdr, secretKey);

    if (verbose) {
      console.log(`✅ Transaction sent successfully`);
      if (result.contractId) {
        console.log(`   Contract ID: ${result.contractId}`);
      }
    }

    return result;
  }

  // ========== MÉTODOS DE CONVENIENCIA POR ENDPOINT ==========

  /**
   * Fund Escrow
   */
  async fundEscrow(contractId, signer, amount, secretKey, verbose = false) {
    const payload = {
      contractId,
      signer,
      amount: parseInt(amount),
    };

    const type = this.detectEscrowType(contractId);
    const endpoint = `/escrow/${type}/fund-escrow`;

    return this.executeTransaction(endpoint, payload, secretKey, verbose);
  }

  /**
   * Approve Milestone
   */
  async approveMilestone(contractId, milestoneIndex, approver, secretKey, verbose = false) {
    const payload = {
      contractId,
      milestoneIndex: String(milestoneIndex),
      approver,
    };

    const type = this.detectEscrowType(contractId);
    const endpoint = `/escrow/${type}/approve-milestone`;

    return this.executeTransaction(endpoint, payload, secretKey, verbose);
  }

  /**
   * Change Milestone Status
   */
  async changeMilestoneStatus(contractId, milestoneIndex, newStatus, newEvidence, serviceProvider, secretKey, verbose = false) {
    const payload = {
      contractId,
      milestoneIndex: String(milestoneIndex),
      newStatus,
      newEvidence,
      serviceProvider,
    };

    const type = this.detectEscrowType(contractId);
    const endpoint = `/escrow/${type}/change-milestone-status`;

    return this.executeTransaction(endpoint, payload, secretKey, verbose);
  }

  /**
   * Release Funds (Single-Release)
   */
  async releaseFunds(contractId, releaseSigner, secretKey, verbose = false) {
    const payload = {
      contractId,
      releaseSigner,
    };

    const endpoint = '/escrow/single-release/release-funds';

    return this.executeTransaction(endpoint, payload, secretKey, verbose);
  }

  /**
   * Release Milestone Funds (Multi-Release)
   */
  async releaseMilestoneFunds(contractId, milestoneIndex, releaseSigner, secretKey, verbose = false) {
    const payload = {
      contractId,
      milestoneIndex: String(milestoneIndex),
      releaseSigner,
    };

    const endpoint = '/escrow/multi-release/release-milestone-funds';

    return this.executeTransaction(endpoint, payload, secretKey, verbose);
  }

  /**
   * Dispute Escrow (Single-Release)
   */
  async disputeEscrow(contractId, signer, secretKey, verbose = false) {
    const payload = {
      contractId,
      signer,
    };

    const endpoint = '/escrow/single-release/dispute-escrow';

    return this.executeTransaction(endpoint, payload, secretKey, verbose);
  }

  /**
   * Resolve Dispute (Single-Release)
   */
  async resolveDispute(contractId, disputeResolver, distributions, secretKey, verbose = false) {
    const payload = {
      contractId,
      disputeResolver,
      distributions,
    };

    const endpoint = '/escrow/single-release/resolve-dispute';

    return this.executeTransaction(endpoint, payload, secretKey, verbose);
  }

  /**
   * Dispute Milestone (Multi-Release)
   */
  async disputeMilestone(contractId, milestoneIndex, signer, secretKey, verbose = false) {
    const payload = {
      contractId,
      milestoneIndex: String(milestoneIndex),
      signer,
    };

    const endpoint = '/escrow/multi-release/dispute-milestone';

    return this.executeTransaction(endpoint, payload, secretKey, verbose);
  }

  /**
   * Resolve Milestone Dispute (Multi-Release)
   */
  async resolveMilestoneDispute(contractId, milestoneIndex, disputeResolver, distributions, secretKey, verbose = false) {
    const payload = {
      contractId,
      milestoneIndex: String(milestoneIndex),
      disputeResolver,
      distributions,
    };

    const endpoint = '/escrow/multi-release/resolve-milestone-dispute';

    return this.executeTransaction(endpoint, payload, secretKey, verbose);
  }

  // ========== UTILIDADES ==========

  /**
   * Detecta el tipo de escrow basado en el contractId
   * Por ahora, retorna 'single-release' por defecto
   * TODO: Implementar detección real si es necesario
   */
  detectEscrowType(contractId) {
    // Esta es una implementación simplificada
    // Podrías agregar lógica para detectar el tipo consultando el contrato
    return 'single-release';
  }
}

/**
 * Factory function para crear un cliente API desde configuración
 */
function createApiClient(config) {
  return new ApiClient(config);
}

module.exports = { ApiClient, createApiClient };
