/**
 * @class ApiFeatures
 * @description A utility class to handle complex query features like filtering, sorting,
 * pagination, field limiting, and searching for Mongoose queries.
 * It uses a fluent interface by returning `this` from each method to allow chaining.
 */
class ApiFeatures {
  /**
   * @param {object} mongooseQuery - The initial Mongoose query object (e.g., Model.find()).
   * @param {object} queryString - The query string object from the request (e.g., req.query).
   */
  constructor(mongooseQuery, queryString) {
    this.mongooseQuery = mongooseQuery;
    this.queryString = queryString;
  }

  /**
   * @description Applies filtering based on the query string.
   * Excludes reserved keywords and formats operators (gte, gt, lte, lt) for Mongoose.
   * @example ?price[gte]=50&brand=Apple
   */
  filter() {
    // 1) Basic Filtering
    const queryStringObject = { ...this.queryString };
    const excludedKeys = ["page", "limit", "sort", "fields", "keyword"];
    excludedKeys.forEach((key) => delete queryStringObject[key]);

    // 2) Advanced Filtering (for operators like gte, lte)
    // Converts { price: { gte: '50' } } to { price: { $gte: '50' } } for Mongoose.
    let queryStr = JSON.stringify(queryStringObject);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);

    this.mongooseQuery = this.mongooseQuery.find(JSON.parse(queryStr));

    return this;
  }

  /**
   * @description Applies sorting to the query. Defaults to newest first.
   * @example ?sort=price,-sold
   */
  sort() {
    if (this.queryString.sort) {
      // Mongoose expects a space-separated string for sorting (e.g., 'price -sold').
      const sortBy = this.queryString.sort.split(",").join(" ");
      this.mongooseQuery = this.mongooseQuery.sort(sortBy);
    } else {
      // Default sort by creation date in descending order (newest first).
      this.mongooseQuery = this.mongooseQuery.sort("-createdAt");
    }
    return this;
  }

  /**
   * @description Applies field limiting (projection) to select specific fields in the output.
   * @example ?fields=title,price,sold
   */
  fieldLimit() {
    if (this.queryString.fields) {
      // Mongoose expects a space-separated string for field selection (e.g., 'title price').
      const fields = this.queryString.fields.split(",").join(" ");
      this.mongooseQuery = this.mongooseQuery.select(fields);
    } else {
      // By default, exclude the '__v' field from the result.
      this.mongooseQuery = this.mongooseQuery.select("-__v");
    }
    return this;
  }

  /**
   * @description Applies a generic, case-insensitive search on a given set of fields.
   * @param {string[]} searchableFields - An array of field names to search within.
   * @example ?keyword=laptop  (and searchableFields = ['title', 'description'])
   */
  search(searchableFields) {
    if (
      this.queryString.keyword &&
      searchableFields &&
      searchableFields.length > 0
    ) {
      const { keyword } = this.queryString;

      // Creates an array of $or conditions for each searchable field.
      const orConditions = searchableFields.map((field) => ({
        [field]: { $regex: keyword, $options: "i" },
      }));

      // Apply the search query using $or to find a match in any of the specified fields.
      this.mongooseQuery = this.mongooseQuery.find({ $or: orConditions });
    }
    return this;
  }

  /**
   * @description Applies pagination to the query and calculates pagination metadata.
   * @param {number} countDocuments - The total number of documents matching the filter criteria.
   * @example ?page=2&limit=10
   */
  paginate(countDocuments) {
    const page = parseInt(this.queryString.page, 10) || 1;
    const limit = parseInt(this.queryString.limit, 10) || 50;
    const skip = (page - 1) * limit;
    const endIndex = page * limit;

    // Construct the pagination metadata object.
    const pagination = {};
    pagination.currentPage = page;
    pagination.limit = limit;
    pagination.numberOfPages = Math.ceil(countDocuments / limit);

    // Add 'next' and 'previous' page numbers where applicable.
    if (endIndex < countDocuments) {
      pagination.next = page + 1;
    }
    if (skip > 0) {
      pagination.prev = page - 1;
    }

    this.mongooseQuery = this.mongooseQuery.skip(skip).limit(limit);
    // Attach the pagination result to the instance for later retrieval.
    this.paginationResult = pagination;
    return this;
  }
}

module.exports = ApiFeatures;
