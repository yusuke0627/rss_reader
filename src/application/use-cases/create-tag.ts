import { Tag } from "@/domain/entities/tag";
import { TagRepository } from "../ports";

export interface CreateTagInput {
  userId: string;
  name: string;
}

export interface CreateTagDependencies {
  tagRepository: TagRepository;
}

export class CreateTag {
  constructor(private readonly deps: CreateTagDependencies) {}

  async execute(input: CreateTagInput): Promise<Tag> {
    // 1. 名前前後の空白を削除
    const trimedName = input.name.trim();

    // 2. 空ならエラー
    if (!trimedName) {
      throw new Error("Tag name cannot be empty");
    }

    // 3. 同じユーザがすでに同じ名前のタグを持っているか検証
    const existingTags = await this.deps.tagRepository.listByUserId(
      input.userId,
    );
    const existingTag = existingTags.find(
      (tag) => tag.name.toLowerCase() === trimedName.toLowerCase(),
    );

    //4. すでに存在すれば新たに作成せずに既存タグを返す
    if (existingTag) {
      return existingTag;
    }

    // 5. タグを作成
    return this.deps.tagRepository.create({
      userId: input.userId,
      name: trimedName,
    });
  }
}
