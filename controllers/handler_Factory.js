const asyncHandler = require("express-async-handler");
const ApiError = require("../utils/API_Errors");
const ApiFeatures = require("../utils/API_Features");

/**
 * @desc    A factory function to create a handler for deleting a document.
 * @param   {import('mongoose').Model} model - The Mongoose model to delete from.
 * @returns {Function} Express async handler.
 */
exports.deleteOne = (model) =>
  asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    // Use findByIdAndDelete for a single, efficient database operation.
    const document = await model.findByIdAndDelete(id);

    if (!document) {
      return next(new ApiError(`No document found for ID: ${id}`, 404));
    }
    // Use 204 No Content for successful deletions.
    res.status(204).send();
  });

/**
 * @desc    A factory function to create a handler for updating a document.
 * @param   {import('mongoose').Model} model - The Mongoose model to update.
 * @returns {Function} Express async handler.
 */
exports.updateOne = (model) =>
  asyncHandler(async (req, res, next) => {
    const document = await model.findByIdAndUpdate(req.params.id, req.body, {
      new: true, // Returns the document after the update is applied.
      runValidators: true, // Ensures schema validators run on the update operation.
    });

    if (!document) {
      return next(
        new ApiError(
          `Update failed: No document found for ID: ${req.params.id}`,
          404
        )
      );
    }
    res.status(200).json({ data: document });
  });

/**
 * @desc    A factory function to create a handler for creating a new document.
 * @param   {import('mongoose').Model} model - The Mongoose model to create a document for.
 * @returns {Function} Express async handler.
 */
exports.createOne = (model) =>
  asyncHandler(async (req, res) => {
    const document = await model.create(req.body);
    res.status(201).json({ data: document });
  });

/**
 * @desc    A factory function to create a handler for getting a single document.
 * @param   {import('mongoose').Model} model - The Mongoose model to query.
 * @param   {string | object} [population] - Optional population options for Mongoose.
 * @returns {Function} Express async handler.
 */
exports.getOne = (model, population) =>
  asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    // 1) Build the initial query.
    let query = model.findById(id);

    // 2) Conditionally add population if provided.
    if (population) {
      query = query.populate(population);
    }

    // 3) Execute the query.
    const document = await query;

    if (!document) {
      return next(new ApiError(`No document found for ID: ${id}`, 404));
    }

    res.status(200).json({ data: document });
  });

/**
 * @desc    A factory function to create a handler for getting all documents.
 * @param   {import('mongoose').Model} model - The Mongoose model to query.
 * @param   {string[]} [searchFields] - An array of fields to enable searching on.
 * @returns {Function} Express async handler.
 */
// Inside controllers/handler_Factory.js

exports.getAll = (model, searchFields = []) =>
  asyncHandler(async (req, res) => {
    // This allows for pre-filtering results, e.g., for nested routes.
    let filter = {};
    if (req.filterObj) {
      filter = req.filterObj;
    }

    // 1) Get the total count of documents for pagination.
    const countDocuments = await model.countDocuments(filter);

    // 2) Build the query using our ApiFeatures utility.
    const features = new ApiFeatures(model.find(filter), req.query)
      .filter()
      .search(searchFields)
      .sort()
      .fieldLimit()
      .paginate(countDocuments);

    const { mongooseQuery, paginationResult } = features;

    // 3) Execute the final query.
    const documents = await mongooseQuery;

    res
      .status(200)
      .json({ results: documents.length, paginationResult, data: documents });
  });
