import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import openApiDocument from './docs/openapi.js';
import authRoutes from './routes/authRoutes.js';
import usuarioRoutes from './routes/usuarioRoutes.js';
import clienteRoutes from './routes/clienteRoutes.js';
import diaristaRoutes from './routes/diaristaRoutes.js';
import enderecoRoutes from './routes/enderecoRoutes.js';
import servicoRoutes from './routes/servicoRoutes.js';
import diaristaServicoRoutes from './routes/diaristaServicoRoutes.js';
import comboBaseRoutes from './routes/comboBaseRoutes.js';
import comboServicoRoutes from './routes/comboServicoRoutes.js';
import disponibilidadeRoutes from './routes/disponibilidadeDiaristaRoutes.js';
import agendamentoRoutes from './routes/agendamentoRoutes.js';
import agendamentoServicoRoutes from './routes/agendamentoServicoRoutes.js';
import checkinCheckoutRoutes from './routes/checkinCheckoutRoutes.js';
import avaliacaoRoutes from './routes/avaliacaoRoutes.js';
import favoritoRoutes from './routes/favoritoRoutes.js';
import denunciaRoutes from './routes/denunciaRoutes.js';
import ocorrenciaRoutes from './routes/ocorrenciaAgendamentoRoutes.js';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler.js';

export const app = express();

app.disable('x-powered-by');
app.use('/api-docs', helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", 'data:'],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
    },
  },
}));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openApiDocument, {
  customSiteTitle: 'Diária Certa API',
  customCss: '',
  swaggerOptions: {
    docExpansion: 'list',
    filter: true,
    persistAuthorization: true,
    tagsSorter: 'alpha',
    operationsSorter: 'method',
  },
}));
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',').map((origin) => origin.trim()) : true,
  credentials: true,
}));
app.use(express.json({ limit: '1mb' }));

app.get('/api-docs.json', (_req, res) => res.status(200).json(openApiDocument));
app.get('/health', (_req, res) => res.status(200).json({ status: 'ok' }));
app.use('/api/auth', authRoutes);
app.use('/api/usuario', usuarioRoutes);
app.use('/api/cliente', clienteRoutes);
app.use('/api/diarista', diaristaRoutes);
app.use('/api/endereco', enderecoRoutes);
app.use('/api/servico', servicoRoutes);
app.use('/api/diarista-servico', diaristaServicoRoutes);
app.use('/api/combo-base', comboBaseRoutes);
app.use('/api/combo-servico', comboServicoRoutes);
app.use('/api/disponibilidade', disponibilidadeRoutes);
app.use('/api/agendamento', agendamentoRoutes);
app.use('/api/agendamento-servico', agendamentoServicoRoutes);
app.use('/api/checkin-checkout', checkinCheckoutRoutes);
app.use('/api/avaliacao', avaliacaoRoutes);
app.use('/api/favorito', favoritoRoutes);
app.use('/api/denuncia', denunciaRoutes);
app.use('/api/ocorrencia', ocorrenciaRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
