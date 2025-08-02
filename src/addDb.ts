import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface AddDbOptions {
  databaseUrl: string;
  runMigration?: boolean;
  envPath?: string;
  silent?: boolean;
}

export interface AddDbResponse {
  success: boolean;
  message: string;
}

/**
 * 🐘 ADD POSTGRESQL DATABASE
 * Simple setup for cloud PostgreSQL (Neon, Supabase, etc.)
 * Uses existing Prisma schema if available
 */
export async function addDb(options: AddDbOptions): Promise<AddDbResponse> {
  const {
    databaseUrl,
    runMigration = true,
    envPath = '../.env',
    silent = false
  } = options;

  const absoluteEnvPath = path.resolve(__dirname, envPath);

  try {
    if (!silent) {
      console.log("🐘 Setting up PostgreSQL database...");
    }

    // Create/update .env file
    const envContent = `DATABASE_URL="${databaseUrl}"
PRISMA_CLI_QUERY_ENGINE_TYPE="binary"
`;

    if (fs.existsSync(absoluteEnvPath)) {
      const existingEnv = fs.readFileSync(absoluteEnvPath, 'utf8');
      
      if (existingEnv.includes('DATABASE_URL=')) {
        const updatedEnv = existingEnv.replace(/DATABASE_URL=.*$/m, `DATABASE_URL="${databaseUrl}"`);
        fs.writeFileSync(absoluteEnvPath, updatedEnv, 'utf8');
      } else {
        fs.appendFileSync(absoluteEnvPath, '\n' + envContent, 'utf8');
      }
    } else {
      fs.writeFileSync(absoluteEnvPath, envContent, 'utf8');
    }

    if (!silent) {
      console.log("✅ .env file updated");
    }

    // Check if Prisma schema exists
    const schemaPath = path.resolve(__dirname, '../prisma/schema.prisma');
    if (!fs.existsSync(schemaPath)) {
      if (!silent) {
        console.log("❌ No Prisma schema found at:", schemaPath);
        console.log("💡 Please ensure your schema.prisma file exists in the prisma folder");
      }
      return { 
        success: false, 
        message: 'Prisma schema not found. Please create schema.prisma in the prisma folder first.' 
      };
    }

    if (!silent) {
      console.log("✅ Using existing Prisma schema");
    }

    // Run migrations
    if (runMigration) {
      if (!silent) {
        console.log("🔄 Running migrations...");
      }
      
      const projectRoot = path.resolve(__dirname, '..');
      
      try {
        await execAsync('npx prisma generate', { cwd: projectRoot });
        await execAsync('npx prisma db push', { cwd: projectRoot });
        
        if (!silent) {
          console.log("✅ Database ready!");
        }
      } catch (error) {
        console.error("❌ Migration failed:", error);
        return { success: false, message: 'Migration failed' };
      }
    }

    return { success: true, message: 'Database setup complete' };

  } catch (error: any) {
    console.error("❌ Setup failed:", error);
    return { success: false, message: error.message || 'Setup failed' };
  }
}

export default addDb;