const doctorsService = require('./doctors.service');
const { successResponse } = require('../../utils/response');

const getAllDoctors = async (req, res, next) => {
  try {
    const doctors = await doctorsService.getAllDoctors();
    return successResponse(res, { doctors }, 'Doctors fetched successfully');
  } catch (error) {
    next(error);
  }
};

const getDoctorById = async (req, res, next) => {
  try {
    const doctor = await doctorsService.getDoctorById(req.params.id);
    return successResponse(res, { doctor }, 'Doctor fetched successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = { getAllDoctors, getDoctorById };
