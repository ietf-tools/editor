<template lang="pug">
q-form.q-gutter-md.q-pa-lg
  .row.items-center
    .col
      .text-body2: strong Git
      .text-caption.text-grey-5 Necessary for the Git source control panel.
    .col-auto.q-mr-md
      q-icon(name='mdi-alert-rhombus', size='sm', color='red-5')
    .col-auto
      q-btn(
        label='Set Path'
        outline
        color='grey-5'
        no-caps
        size='sm'
      )
    q-separator.q-ml-sm.q-mx-md(vertical, inset)
    .col-auto
      q-btn(
        label='Install'
        unelevated
        color='primary'
        no-caps
      )
  q-separator
  .row.items-center
    .col
      .text-body2: strong LemMinX
      .text-caption.text-grey-5 Provides a Language Server Protocol for the XML format.
    .col-auto
      q-btn-group(unelevated)
        q-btn(
          unelevated
          color='teal'
          icon='mdi-check-decagram'
          padding='none sm'
          )
          q-tooltip Installed
        q-btn(
          label='Re-Install'
          outline
          color='teal-5'
          no-caps
        )
  q-separator
  .row.items-center
    .col
      .text-body2: strong Python
      .text-caption.text-grey-5 Used to run certain validation and document generation tools.
    .col-auto.q-mr-md
      q-icon(name='mdi-alert-rhombus', size='sm', color='red-5')
    .col-auto
      q-btn(
        label='Set Path'
        outline
        color='grey-5'
        no-caps
        size='sm'
      )
    q-separator.q-ml-sm.q-mx-md(vertical, inset)
    .col-auto
      q-btn(
        label='Install'
        unelevated
        color='primary'
        no-caps
      )
  .q-pl-md
    .row.items-center.q-my-sm
      .col
        .text-body2 rfc2html
        .text-caption.text-grey-5 Generate HTML output from text-formatted RFCs and Internet-Drafts.
      .col-auto
        q-btn(
          label='Install'
          unelevated
          color='indigo-8'
          size='sm'
        )
    .row.items-center.q-my-sm
      .col
        .text-body2 svgcheck
        .text-caption.text-grey-5 Validate svg files.
      .col-auto
        q-btn(
          label='Install'
          unelevated
          color='indigo-8'
          size='sm'
        )
    .row.items-center.q-my-sm
      .col
        .text-body2 xml2rfc
        .text-caption.text-grey-5 Generate various outputs from XMLRFC documents.
      .col-auto
        q-btn(
          label='Install'
          unelevated
          color='indigo-8'
          size='sm'
        )
</template>

<script setup>

</script>
