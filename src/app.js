import { express } from 'express';
import { UsuarioRoutes } from '../controllers/usuarioRoutes';
import { ClienteRoutes } from '../controllers/clienteRoutes';
import { DiaristaRoutes } from '../controllers/diaristaRoutes';
import { ComboBaseRoutes } from '../controllers/comboBaseRoutes';
import { EnderecoRoutes } from '../controllers/enderecoRoutes';

export const app = express();
app.use(express.json());

app.use('/api/usuario', UsuarioRoutes);
app.use('/api/cliente', ClienteRoutes);
app.use('/api/diarista', DiaristaRoutes);
app.use('/api/combo_base', ComboBaseRoutes);
app.use('/api/endereco', EnderecoRoutes);
