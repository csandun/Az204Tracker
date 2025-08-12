import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { module_id, title, order } = body

    if (!module_id || !title || order === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: module_id, title, order' },
        { status: 400 }
      )
    }

    // Get the highest sort_order for proper ordering
    const { data: lastSection } = await supabase
      .from('module_sections')
      .select('sort_order')
      .order('sort_order', { ascending: false })
      .limit(1)
      .single()

    const nextSortOrder = (lastSection?.sort_order || 0) + 1

    // Insert the new section
    const { data: newSection, error } = await supabase
      .from('module_sections')
      .insert({
        module_id,
        title,
        order,
        sort_order: nextSortOrder
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating section:', error)
      return NextResponse.json({ error: 'Failed to create section' }, { status: 500 })
    }

    return NextResponse.json({ data: newSection }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/sections:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(request.url)
    const sectionId = url.searchParams.get('id')

    if (!sectionId) {
      return NextResponse.json(
        { error: 'Missing section ID' },
        { status: 400 }
      )
    }

    // Delete the section
    const { error } = await supabase
      .from('module_sections')
      .delete()
      .eq('id', sectionId)

    if (error) {
      console.error('Error deleting section:', error)
      return NextResponse.json({ error: 'Failed to delete section' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Section deleted successfully' }, { status: 200 })
  } catch (error) {
    console.error('Error in DELETE /api/sections:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
