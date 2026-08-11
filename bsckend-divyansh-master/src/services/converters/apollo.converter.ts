import type {
  ApolloPersonDataDto,
  EnrichedUserDataDto,
} from '../types/user_enrichment.types';

export class ApolloConverter {
  static toApolloPersonDataDto(
    person_data: Record<string, unknown>,
  ): ApolloPersonDataDto {
    return {
      id: person_data.id as string | undefined,
      first_name: person_data.first_name as string | undefined,
      last_name: person_data.last_name as string | undefined,
      name: person_data.name as string | undefined,
      linkedin_url: person_data.linkedin_url as string | undefined,
      title: person_data.title as string | undefined,
      email_status: person_data.email_status as string | undefined,
      photo_url: person_data.photo_url as string | undefined,
      twitter_url: person_data.twitter_url as string | undefined,
      github_url: person_data.github_url as string | undefined,
      facebook_url: person_data.facebook_url as string | undefined,
      headline: person_data.headline as string | undefined,
      email: person_data.email as string | undefined,
      organization_id: person_data.organization_id as string | undefined,
      employment_history: person_data.employment_history as
        | Record<string, unknown>[]
        | undefined,
      state: person_data.state as string | undefined,
      city: person_data.city as string | undefined,
      country: person_data.country as string | undefined,
      organization: person_data.organization as
        | Record<string, unknown>
        | undefined,
    };
  }

  static toEnrichedUserDataDto(
    email: string,
    person: ApolloPersonDataDto,
  ): EnrichedUserDataDto {
    const org = person.organization;

    const enriched_data: EnrichedUserDataDto = { email };

    if (person.first_name) enriched_data.first_name = person.first_name;
    if (person.last_name) enriched_data.last_name = person.last_name;
    if (person.title) enriched_data.title = person.title;
    if (org?.name) enriched_data.company_name = org.name as string;
    if (org?.logo_url) enriched_data.company_logo = org.logo_url as string;
    if (org?.short_description)
      enriched_data.company_description = org.short_description as string;
    if (person.linkedin_url) enriched_data.linkedin_url = person.linkedin_url;
    if (person.photo_url) enriched_data.photo_url = person.photo_url;
    if (person.city) enriched_data.city = person.city;
    if (person.country) enriched_data.country = person.country;

    return enriched_data;
  }
}
