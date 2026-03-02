const doctorsRepository = require('./doctors.repository');

const getAllDoctors = async () => {
  return await doctorsRepository.getAllDoctors();
};

const getDoctorById = async (id) => {
  const doctor = await doctorsRepository.getDoctorById(id);
  if (!doctor) {
    const error = new Error('Doctor not found');
    error.statusCode = 404;
    error.isOperational = true;
    throw error;
  }
  return doctor;
};

module.exports = { getAllDoctors, getDoctorById };
