import { NotFoundError, BadRequestError } from '../../common/errors/AppError';
import * as repository from './categories.repository';
import type { CreateCategoryInput, UpdateCategoryInput } from '@nuraskin/shared-types';
import { v2 as cloudinary } from 'cloudinary';
import { env } from '../../common/config/env';

// Initialize Cloudinary
if (env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
  });
}

export async function getCategories(options: { page?: number; limit?: number } = {}) {
  const page = options.page || 1;
  const limit = options.limit || 10;
  const offset = (page - 1) * limit;

  const [data, total] = await Promise.all([
    repository.findAll({ limit, offset }),
    repository.count(),
  ]);

  return {
    data,
    total,
    page,
    limit,
  };
}

export async function getCategory(id: string) {
  const category = await repository.findById(id);
  if (!category) {
    throw new NotFoundError('Category not found');
  }
  return category;
}

export async function createCategory(input: CreateCategoryInput) {
  const existing = await repository.findBySlug(input.slug);
  if (existing) {
    throw new BadRequestError('Category with this slug already exists');
  }

  return repository.create(input);
}

export async function updateCategory(id: string, input: UpdateCategoryInput) {
  const category = await repository.findById(id);
  if (!category) {
    throw new NotFoundError('Category not found');
  }

  if (input.slug && input.slug !== category.slug) {
    const existing = await repository.findBySlug(input.slug);
    if (existing) {
      throw new BadRequestError('Category with this slug already exists');
    }
  }

  return repository.update(id, input);
}

export async function deleteCategory(id: string) {
  const category = await repository.findById(id);
  if (!category) {
    throw new NotFoundError('Category not found');
  }
  await repository.softDelete(id);
}

export async function generateUploadUrl() {
  if (!env.CLOUDINARY_CLOUD_NAME || !env.CLOUDINARY_API_KEY || !env.CLOUDINARY_API_SECRET) {
    throw new Error('Cloudinary is not configured');
  }

  const timestamp = Math.round(new Date().getTime() / 1000);
  const signature = cloudinary.utils.api_sign_request(
    { timestamp },
    env.CLOUDINARY_API_SECRET
  );

  return {
    url: `https://api.cloudinary.com/v1_1/${env.CLOUDINARY_CLOUD_NAME}/image/upload`,
    timestamp,
    signature,
    apiKey: env.CLOUDINARY_API_KEY,
  };
}
