import { Flex, Item, Picker, SearchField, Text } from '@adobe/react-spectrum';
import { SearchField as QueryField } from '../../search/SearchEngine.js';

/**
 * Search + scope + sort.
 *
 * The scope picker is the "search query parameters" requirement made explicit:
 * the same box can be aimed at the model name, at the family/architecture, or
 * at everything. `onQueryChange` feeds the debounced+throttled scheduler while
 * Enter (`onSubmit`) bypasses both timers for an instant answer.
 */
export function SearchToolbar({
  value,
  field,
  sort,
  sortOptions,
  matched,
  total,
  isFiltered,
  onQueryChange,
  onQuerySubmit,
  onFieldChange,
  onSortChange,
}) {
  return (
    <div className="toolbar">
      <Flex gap="size-150" wrap alignItems="end" UNSAFE_className="toolbar__row">
        <SearchField
          label="Search models"
          description="Try llama, qwen, whisper — matches from the start or the middle of a value."
          value={value}
          onChange={onQueryChange}
          onSubmit={onQuerySubmit}
          onClear={() => onQuerySubmit('')}
          width="100%"
          maxWidth="size-4600"
          UNSAFE_className="toolbar__search"
        />

        <Picker
          label="Search in"
          selectedKey={field}
          onSelectionChange={(key) => onFieldChange(String(key))}
          width="size-2000"
        >
          <Item key={QueryField.ALL}>All fields</Item>
          <Item key={QueryField.NAME}>Model name</Item>
          <Item key={QueryField.FAMILY}>Model family</Item>
        </Picker>

        <Picker
          label="Sort by"
          selectedKey={sort}
          onSelectionChange={(key) => onSortChange(String(key))}
          width="size-3000"
        >
          {sortOptions.map((option) => (
            <Item key={option.id}>{option.label}</Item>
          ))}
        </Picker>
      </Flex>

      <Text UNSAFE_className="toolbar__count">
        {isFiltered ? (
          <>
            <strong>{matched.toLocaleString()}</strong> of {total.toLocaleString()} models match
          </>
        ) : (
          <>
            <strong>{total.toLocaleString()}</strong> models in the catalogue
          </>
        )}
      </Text>
    </div>
  );
}
