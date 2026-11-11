import { UserRepository } from '../../repositories/userRepository.js';
import { ConflictError } from '../../errors/index.js';

function existingAccountMessage(user, field) {
  const account = `Este ${field} já possui uma conta`;
  switch (user.tipo) {
    case 'CLIENTE':
      return `${account} de cliente. Você também pode se tornar diarista usando a mesma conta. Entre na conta existente e complete o cadastro de diarista, sem criar outra conta.`;
    case 'DIARISTA':
      return `${account} de diarista. Você também pode ser cliente usando a mesma conta. Entre na conta existente e complete o cadastro de cliente, sem criar outra conta.`;
    case 'AMBOS':
      return `${account} com os perfis de cliente e diarista. Entre na conta existente e escolha o perfil que deseja usar, sem criar outra conta.`;
    default:
      return `${account}. Entre nela para acessar ou adicionar outro perfil.`;
  }
}

// Consulta antecipada; a criação continua verificando os mesmos conflitos.
export class CheckUsuarioAvailabilityService {
  constructor(repository = new UserRepository()) {
    this.repository = repository;
  }

  async execute({ cpf, email }) {
    const existingEmail = email && await this.repository.findByEmail(email.trim().toLowerCase());
    if (existingEmail) {
      throw new ConflictError('E-mail já cadastrado', {
        fieldErrors: { email: [existingAccountMessage(existingEmail, 'e-mail')] },
      });
    }
    const existingCpf = cpf && await this.repository.findByCpf(cpf);
    if (existingCpf) {
      throw new ConflictError('CPF já cadastrado', {
        fieldErrors: { cpf: [existingAccountMessage(existingCpf, 'CPF')] },
      });
    }
    return { disponivel: true };
  }
}
