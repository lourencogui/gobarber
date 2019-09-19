import { isPast, parseISO, startOfHour } from 'date-fns';
import * as Yup from 'yup';
import User from '../models/User';
import File from '../models/File';
import Appointment from '../models/Appointment';

class AppointmentController {
  async index(req, res) {
    const { page = 1 } = req.query;
    const appointments = await Appointment.findAll({
      where: { user_id: req.userId, canceled_at: null },
      order: ['date'],
      attributes: ['id', 'date'],
      limit: 20,
      offset: (page - 1) * 20,
      include: [
        {
          model: User,
          as: 'provider',
          attributes: ['id', 'email'],
          include: [
            {
              model: File,
              as: 'avatar',
              attributes: ['id', 'url', 'path'],
            },
          ],
        },
      ],
    });

    return res.json(appointments);
  }

  async store(req, res) {
    const schema = Yup.object().shape({
      provider_id: Yup.number().required(),
      date: Yup.date().required(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation failed' });
    }
    const { provider_id, date } = req.body;

    const checkIsProvider = await User.findOne({
      where: { id: provider_id, provider: true },
    });

    // VERIFICA SE PRESTADOR DE SERVIÇO EXISTE
    if (!checkIsProvider) {
      return res.status(400).json({ error: 'You must send a valid provider' });
    }

    const hourStart = startOfHour(parseISO(date));

    // VERIFICA SE A DATA DE AGENDAMENTO NÃO É UMA DATA JÁ PASSADA
    if (isPast(hourStart)) {
      return res.status(400).json({ error: 'Past dates are not allowed' });
    }

    const providerBusy = await Appointment.findOne({
      where: { provider_id, date: hourStart, canceled_at: null },
    });

    if (providerBusy) {
      return res
        .status(400)
        .json({ error: 'Appointment date is not available' });
    }

    const appointment = await Appointment.create({
      user_id: req.userId,
      provider_id,
      date,
    });

    return res.json(appointment);
  }
}

export default new AppointmentController();
