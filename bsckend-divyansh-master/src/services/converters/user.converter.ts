import type { User, UserSocials } from '../../db/mongo/models/types';
import type { ApolloPersonDataDto, EnrichedUserDataDto } from '../types/user_enrichment.types';

export class UserConverter {
  static toUserUpdateData(
    person: ApolloPersonDataDto,
    ttl_date: Date,
  ): Partial<User> {
    const update_data: Partial<User> = {
      enrichment_ttl: ttl_date,
      updated_at: new Date(),
    };

    if (person.first_name) update_data.first_name = person.first_name;
    if (person.last_name) update_data.last_name = person.last_name;
    if (person.title) update_data.designation = person.title;

    const org = person.organization;
    if (org) {
      if (org.name) update_data.company_name = org.name as string;
      if (org.logo_url) update_data.company_logo = org.logo_url as string;
      if (org.website_url)
        update_data.company_website = org.website_url as string;
      if (org.short_description)
        update_data.company_description = org.short_description as string;
    }

    const socials: UserSocials = {};
    if (person.linkedin_url) socials.linkedin = person.linkedin_url;
    if (person.twitter_url) socials.twitter = person.twitter_url;
    if (person.github_url) socials.github = person.github_url;
    if (person.facebook_url) socials.facebook = person.facebook_url;

    if (Object.keys(socials).length > 0) {
      update_data.socials = socials;
    }

    return update_data;
  }

  static toEnrichedUserDataDto(user: User): EnrichedUserDataDto {
    const enriched_data: EnrichedUserDataDto = {
      email: user.email || '',
    };

    if (user.first_name) enriched_data.first_name = user.first_name;
    if (user.last_name) enriched_data.last_name = user.last_name;
    if (user.designation) enriched_data.title = user.designation;
    if (user.company_name) enriched_data.company_name = user.company_name;
    if (user.company_logo) enriched_data.company_logo = user.company_logo;
    if (user.company_description)
      enriched_data.company_description = user.company_description;
    if (user.socials?.linkedin) enriched_data.linkedin_url = user.socials.linkedin;

    return enriched_data;
  }
}
