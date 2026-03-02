const doctorsService = require('./doctors.service');
const { successResponse } = require('../../utils/response');
const { isUserOnline } = require('../../sockets/socketHandler');

const getAllDoctors = async (req, res, next) => {
  try {
    const doctors = await doctorsService.getAllDoctors();
    const doctorsWithStatus = doctors.map((doc) => ({
      ...doc,
      is_online: isUserOnline(doc.user_id),
    }));
    return successResponse(res, { doctors: doctorsWithStatus }, 'Doctors list updated');
  } catch (error) {
    next(error);
  }
};

const getDoctorById = async (req, res, next) => {
  try {
    const doctor = await doctorsService.getDoctorById(req.params.id);
    const doctorWithStatus = doctor ? {
      ...doctor,
      is_online: isUserOnline(doctor.user_id),
    } : null;
    return successResponse(res, { doctor: doctorWithStatus }, 'Doctor fetched successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = { getAllDoctors, getDoctorById };
