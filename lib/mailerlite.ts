
/**
 * Mailerlite Integration Library
 * 
 * This library handles all interactions with the Mailerlite API for newsletter management
 * and subscriber synchronization.
 */

/**
 * Get Mailerlite API key from environment variable
 * The API key should be set in MAILERLITE_API_KEY environment variable
 */
function getMailerliteApiKey(): string {
  return process.env.MAILERLITE_API_KEY || '';
}

const MAILERLITE_API_URL = 'https://api.mailerlite.com/api/v2';

interface MailerliteSubscriber {
  email: string;
  name?: string;
  fields?: {
    [key: string]: string | number | boolean;
  };
  groups?: string[];
  resubscribe?: boolean;
}

interface MailerliteGroup {
  id: string;
  name: string;
  total: number;
}

/**
 * Add or update a subscriber in Mailerlite
 * @param subscriber - Subscriber information
 * @returns Subscriber data from Mailerlite
 */
export async function addSubscriber(subscriber: MailerliteSubscriber) {
  try {
    const apiKey = getMailerliteApiKey();
    const response = await fetch(`${MAILERLITE_API_URL}/subscribers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-MailerLite-ApiKey': apiKey
      },
      body: JSON.stringify({
        email: subscriber.email,
        name: subscriber.name,
        fields: subscriber.fields,
        resubscribe: subscriber.resubscribe !== false, // Default true
        type: 'active'
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Mailerlite API error:', response.status, errorText);
      throw new Error(`Mailerlite API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error adding subscriber to Mailerlite:', error);
    throw error;
  }
}

/**
 * Get all groups from Mailerlite account
 * @returns Array of groups
 */
export async function getGroups(): Promise<MailerliteGroup[]> {
  try {
    const apiKey = getMailerliteApiKey();
    const response = await fetch(`${MAILERLITE_API_URL}/groups`, {
      method: 'GET',
      headers: {
        'X-MailerLite-ApiKey': apiKey
      }
    });

    if (!response.ok) {
      throw new Error(`Mailerlite API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting groups from Mailerlite:', error);
    throw error;
  }
}

/**
 * Create a new group in Mailerlite
 * @param name - Group name
 * @returns Created group data
 */
export async function createGroup(name: string) {
  try {
    const apiKey = getMailerliteApiKey();
    const response = await fetch(`${MAILERLITE_API_URL}/groups`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-MailerLite-ApiKey': apiKey
      },
      body: JSON.stringify({ name })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Mailerlite API error:', response.status, errorText);
      throw new Error(`Mailerlite API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating group in Mailerlite:', error);
    throw error;
  }
}

/**
 * Add subscriber to a specific group
 * @param email - Subscriber email
 * @param groupId - Group ID
 * @returns Updated subscriber data
 */
export async function addSubscriberToGroup(email: string, groupId: string) {
  try {
    const apiKey = getMailerliteApiKey();
    const response = await fetch(
      `${MAILERLITE_API_URL}/groups/${groupId}/subscribers`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-MailerLite-ApiKey': apiKey
        },
        body: JSON.stringify({ email })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Mailerlite API error:', response.status, errorText);
      throw new Error(`Mailerlite API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error adding subscriber to group:', error);
    throw error;
  }
}

/**
 * Get or create a group by name
 * @param groupName - Name of the group
 * @returns Group data
 */
export async function getOrCreateGroup(groupName: string) {
  try {
    // Get all groups
    const groups = await getGroups();
    
    // Check if group exists
    const existingGroup = groups.find(
      (g: MailerliteGroup) => g.name.toLowerCase() === groupName.toLowerCase()
    );
    
    if (existingGroup) {
      return existingGroup;
    }
    
    // Create new group
    return await createGroup(groupName);
  } catch (error) {
    console.error('Error in getOrCreateGroup:', error);
    throw error;
  }
}

/**
 * Sync enrollment to Mailerlite
 * This function adds the enrolled student to Mailerlite and assigns them to the program group
 * 
 * @param email - Student email
 * @param name - Student name
 * @param programTitle - Title of the program
 * @param cohortName - Name of the cohort
 */
export async function syncEnrollmentToMailerlite(
  email: string,
  name: string,
  programTitle: string,
  cohortName: string
) {
  try {
    // Add or update subscriber in Mailerlite
    await addSubscriber({
      email,
      name,
      fields: {
        programa: programTitle,
        cohorte: cohortName,
        fecha_inscripcion: new Date().toISOString().split('T')[0]
      },
      resubscribe: true
    });

    // Get or create group for this program
    const groupName = `Estudiantes - ${programTitle}`;
    const group = await getOrCreateGroup(groupName);

    // Add subscriber to program group
    if (group && group.id) {
      await addSubscriberToGroup(email, group.id);
    }

    console.log(`Successfully synced enrollment to Mailerlite: ${email} -> ${groupName}`);
    
    return {
      success: true,
      email,
      groupName
    };
  } catch (error) {
    console.error('Error syncing enrollment to Mailerlite:', error);
    // Don't throw error to prevent enrollment failure if Mailerlite sync fails
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Unsubscribe a user from Mailerlite
 * @param email - Email to unsubscribe
 */
export async function unsubscribeFromMailerlite(email: string) {
  try {
    const apiKey = getMailerliteApiKey();
    // Mailerlite uses the subscriber ID, but we can search by email
    const response = await fetch(
      `${MAILERLITE_API_URL}/subscribers/${encodeURIComponent(email)}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-MailerLite-ApiKey': apiKey
        },
        body: JSON.stringify({ type: 'unsubscribed' })
      }
    );

    if (!response.ok) {
      throw new Error(`Mailerlite API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error unsubscribing from Mailerlite:', error);
    throw error;
  }
}
