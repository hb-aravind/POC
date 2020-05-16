/**
 * @apiDefine CustomerListDetail
 *
 * @apiSuccess {Array[]} docs List of customers.
 * @apiSuccess {String} docs.email Email of customer.
 * @apiSuccess {String} docs.firstName First name of customer.
 * @apiSuccess {String} docs.lastName Last name of customer.
 * @apiSuccess {String} docs.createddate created date of customer.
 * @apiSuccess {String} docs.status status of customer.
 */

/**
 * @apiDefine CustomerObject
 *
 * @apiParam {String} firstName Customer firstName.
 * @apiParam {String} lastName Customer lastName.
 * @apiParam {String} email Customer email.
 * @apiParam {String} password Customer Password.
 * @apiParam {String} mobile Mobile number of customer.
 * @apiParam {String} gender Gender of customer.
 * @apiParam {String} birthdate Birth Date of customer.
 * @apiParam {Object} country Customer's country.
 * @apiParam {String} country.name Customer's country name.
 * @apiParam {String} country._id Customer's country unique identifier.
 * @apiParam {Object} state Customer's state.
 * @apiParam {String} state.name Customer's state name.
 * @apiParam {String} state._id Customer's state unique identifier.
 * @apiParam {Object} city Customer's state.
 * @apiParam {String} city.name Customer's city name.
 * @apiParam {String} city._id Customer's city unique identifier.
 * @apiParam {Boolean} active Flag whether to make customer active.
 */
