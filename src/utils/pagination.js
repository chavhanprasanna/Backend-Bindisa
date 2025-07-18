import { ApiError } from './apiError.js';

/**
 * Pagination utility class
 */
class Pagination {
  /**
   * Get pagination parameters from request query
   * @param {Object} query - Request query object
   * @param {Object} [options] - Additional options
   * @param {number} [options.defaultLimit=10] - Default items per page
   * @param {number} [options.maxLimit=100] - Maximum items per page
   * @param {string[]} [options.allowedSortFields=[]] - Allowed fields for sorting
   * @param {Object} [options.defaultSort={ _id: -1 }] - Default sort criteria
   * @returns {Object} Pagination parameters
   */
  static getPaginationParams(query, options = {}) {
    const {
      defaultLimit = 10,
      maxLimit = 100,
      allowedSortFields = [],
      defaultSort = { _id: -1 }
    } = options;

    // Parse page and limit
    const page = Math.max(1, parseInt(query.page, 10) || 1);
    let limit = parseInt(query.limit, 10) || defaultLimit;

    // Ensure limit doesn't exceed maximum
    limit = Math.min(limit, maxLimit);

    // Calculate skip value
    const skip = (page - 1) * limit;

    // Parse sort
    let sort = defaultSort;
    if (query.sort) {
      sort = this.parseSortQuery(query.sort, allowedSortFields);
    }

    // Parse filters
    const filters = { ...query };
    const excludedFields = ['page', 'sort', 'limit', 'fields'];
    excludedFields.forEach(field => delete filters[field]);

    // Parse fields to return (projection)
    let fields = {};
    if (query.fields) {
      fields = this.parseFieldsQuery(query.fields);
    }

    return {
      page,
      limit,
      skip,
      sort,
      filters,
      fields: Object.keys(fields).length > 0 ? fields : undefined
    };
  }

  /**
   * Parse sort query string into MongoDB sort object
   * @param {string} sortQuery - Sort query string (e.g., 'name,-createdAt')
   * @param {string[]} allowedFields - Allowed fields for sorting
   * @returns {Object} MongoDB sort object
   */
  static parseSortQuery(sortQuery, allowedFields = []) {
    const sortFields = sortQuery.split(',');
    const sort = {};

    for (const field of sortFields) {
      let sortOrder = 1;
      let fieldName = field.trim();

      // Check for descending sort
      if (fieldName.startsWith('-')) {
        sortOrder = -1;
        fieldName = fieldName.substring(1);
      }

      // Validate field is allowed if allowedFields is provided
      if (allowedFields.length > 0 && !allowedFields.includes(fieldName)) {
        throw new ApiError(400, `Invalid sort field: ${fieldName}`);
      }

      sort[fieldName] = sortOrder;
    }

    return sort;
  }

  /**
   * Parse fields query string into MongoDB projection object
   * @param {string} fieldsQuery - Fields query string (e.g., 'name,email,createdAt')
   * @returns {Object} MongoDB projection object
   */
  static parseFieldsQuery(fieldsQuery) {
    const fields = fieldsQuery.split(',').map(field => field.trim());
    const projection = {};

    for (const field of fields) {
      if (field.startsWith('-')) {
        // Exclude field
        projection[field.substring(1)] = 0;
      } else {
        // Include field
        projection[field] = 1;
      }
    }

    return projection;
  }

  /**
   * Generate pagination metadata
   * @param {number} totalItems - Total number of items
   * @param {number} page - Current page
   * @param {number} limit - Items per page
   * @returns {Object} Pagination metadata
   */
  static getPaginationMeta(totalItems, page, limit) {
    const totalPages = Math.ceil(totalItems / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    return {
      totalItems,
      itemsPerPage: limit,
      currentPage: page,
      totalPages,
      hasNextPage,
      hasPreviousPage,
      nextPage: hasNextPage ? page + 1 : null,
      previousPage: hasPreviousPage ? page - 1 : null
    };
  }

  /**
   * Format paginated response
   * @param {Array} items - Array of items
   * @param {Object} meta - Pagination metadata
   * @param {Object} [additionalData] - Additional data to include in the response
   * @returns {Object} Formatted paginated response
   */
  static formatPaginatedResponse(items, meta, additionalData = {}) {
    return {
      success: true,
      data: items,
      meta: {
        ...meta,
        ...additionalData
      }
    };
  }

  /**
   * Generate pagination links for HATEOAS
   * @param {string} baseUrl - Base URL for the resource
   * @param {Object} meta - Pagination metadata
   * @param {Object} query - Original query parameters
   * @returns {Object} Links object with HATEOAS links
   */
  static generatePaginationLinks(baseUrl, meta, query) {
    const { currentPage, totalPages } = meta;
    const queryParams = new URLSearchParams();

    // Add existing query parameters
    Object.entries(query).forEach(([key, value]) => {
      if (key !== 'page') {
        queryParams.set(key, value);
      }
    });

    const queryString = queryParams.toString();
    const baseLink = queryString ? `${baseUrl}?${queryString}&` : `${baseUrl}?`;

    const links = {
      self: `${baseLink}page=${currentPage}`,
      first: `${baseLink}page=1`,
      last: `${baseLink}page=${totalPages}`
    };

    if (currentPage > 1) {
      links.prev = `${baseLink}page=${currentPage - 1}`;
    }

    if (currentPage < totalPages) {
      links.next = `${baseLink}page=${currentPage + 1}`;
    }

    return links;
  }
}

export default Pagination;
