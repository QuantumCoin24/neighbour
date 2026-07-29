import type { ProfileEntity } from './profile.entity';

export abstract class ProfileRepository {
  abstract save(profile: ProfileEntity): Promise<ProfileEntity>;

  abstract findById(id: string): Promise<ProfileEntity | undefined>;

  abstract findByUserId(userId: string): Promise<ProfileEntity | undefined>;

  abstract findByUsername(username: string): Promise<ProfileEntity | undefined>;

  abstract update(profile: ProfileEntity): Promise<ProfileEntity>;
}
