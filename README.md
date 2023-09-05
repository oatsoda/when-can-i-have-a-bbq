# When can I have a BBQ?

## Development

In the project directory, run:

`yarn start`

and

`yarn tailwind:watch`

## TODO

- Move results to different page URL?
- Further improve visual elements
- Improve algorithm -
  - It's probably a bit lenient at the moment
  - Improve the Precipitation choices
  - Filter out cooler temperatures if there are better ones (i.e. only LOW scores)
  - Add windspeed and windgusts
- Results
  - Warn on high UV Index
- Add knobs to allow users to tweak the results
- Finish implementing the location typeahead/lookup
  - Current API is messy, very verbose and heavily rate limited. Perhaps use Azure Maps wrapped in a container?
  - Loading state while the typeahead is executing
- Apply Tailwind CSS
- Add accreditation for logo:
  - `<a href="https://www.flaticon.com/free-icons/cook" title="cook icons">Cook icons created by Freepik - Flaticon</a>`
