import { config, collection, fields } from '@keystatic/core'

export default config({
  storage: process.env.NODE_ENV === 'production'
    ? {
        kind: 'github',
        repo: 'tordar/spanderbukser',
      }
    : { kind: 'local' },
  collections: {
    products: collection({
      label: 'Products',
      slugField: 'handle',
      path: 'data/products/*',
      format: { data: 'json' },
      schema: {
        handle: fields.text({ label: 'Handle' }),
        id: fields.text({ label: 'ID' }),
        title: fields.text({ label: 'Title' }),
        description: fields.text({ label: 'Description', multiline: true }),
        descriptionHtml: fields.text({ label: 'Description HTML', multiline: true }),
        availableForSale: fields.checkbox({ label: 'Available for Sale', defaultValue: true }),
        tags: fields.array(
          fields.text({ label: 'Tag' }),
          { label: 'Tags', itemLabel: (props) => props.value }
        ),
        options: fields.array(
          fields.object({
            id: fields.text({ label: 'ID' }),
            name: fields.text({ label: 'Name' }),
            values: fields.array(
              fields.text({ label: 'Value' }),
              { label: 'Values', itemLabel: (props) => props.value }
            ),
          }),
          { label: 'Options', itemLabel: (props) => props.fields.name.value }
        ),
        variants: fields.array(
          fields.object({
            id: fields.text({ label: 'ID' }),
            title: fields.text({ label: 'Title' }),
            availableForSale: fields.checkbox({ label: 'Available for Sale', defaultValue: true }),
            selectedOptions: fields.array(
              fields.object({
                name: fields.text({ label: 'Name' }),
                value: fields.text({ label: 'Value' }),
              }),
              {
                label: 'Selected Options',
                itemLabel: (props) =>
                  `${props.fields.name.value}: ${props.fields.value.value}`,
              }
            ),
            price: fields.object({
              amount: fields.text({ label: 'Amount' }),
              currencyCode: fields.text({ label: 'Currency Code' }),
            }),
          }),
          { label: 'Variants', itemLabel: (props) => props.fields.title.value }
        ),
        priceRange: fields.object({
          minVariantPrice: fields.object({
            amount: fields.text({ label: 'Amount' }),
            currencyCode: fields.text({ label: 'Currency Code' }),
          }),
          maxVariantPrice: fields.object({
            amount: fields.text({ label: 'Amount' }),
            currencyCode: fields.text({ label: 'Currency Code' }),
          }),
        }),
        featuredImage: fields.object({
          url: fields.text({ label: 'URL' }),
          altText: fields.text({ label: 'Alt Text' }),
          width: fields.integer({ label: 'Width', defaultValue: 800 }),
          height: fields.integer({ label: 'Height', defaultValue: 1000 }),
        }),
        images: fields.array(
          fields.object({
            url: fields.text({ label: 'URL' }),
            altText: fields.text({ label: 'Alt Text' }),
            width: fields.integer({ label: 'Width', defaultValue: 800 }),
            height: fields.integer({ label: 'Height', defaultValue: 1000 }),
          }),
          { label: 'Images', itemLabel: (props) => props.fields.altText.value }
        ),
        seo: fields.object({
          title: fields.text({ label: 'SEO Title' }),
          description: fields.text({ label: 'SEO Description', multiline: true }),
        }),
        updatedAt: fields.text({ label: 'Updated At' }),
      },
    }),

    collections: collection({
      label: 'Collections',
      slugField: 'handle',
      path: 'data/collections/*',
      format: { data: 'json' },
      schema: {
        handle: fields.text({ label: 'Handle' }),
        title: fields.text({ label: 'Title' }),
        description: fields.text({ label: 'Description', multiline: true }),
        seo: fields.object({
          title: fields.text({ label: 'SEO Title' }),
          description: fields.text({ label: 'SEO Description', multiline: true }),
        }),
        updatedAt: fields.text({ label: 'Updated At' }),
        path: fields.text({ label: 'Path' }),
      },
    }),

    pages: collection({
      label: 'Pages',
      slugField: 'handle',
      path: 'data/pages/*',
      format: { data: 'json' },
      schema: {
        handle: fields.text({ label: 'Handle' }),
        id: fields.text({ label: 'ID' }),
        title: fields.text({ label: 'Title' }),
        body: fields.text({ label: 'Body', multiline: true }),
        bodySummary: fields.text({ label: 'Body Summary', multiline: true }),
        seo: fields.object({
          title: fields.text({ label: 'SEO Title' }),
          description: fields.text({ label: 'SEO Description', multiline: true }),
        }),
        createdAt: fields.text({ label: 'Created At' }),
        updatedAt: fields.text({ label: 'Updated At' }),
      },
    }),
  },
})
